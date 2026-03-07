import {
    WebStorageInitializationError,
    WebStorageRequestError,
    WebStorageTransactionError,
    WebStorageUnavailableError,
} from "./errors";

export interface BrowserDbStorageOptions {
    dbName?: string;
    storeName?: string;
    version?: number;
}

const DEFAULT_DB_NAME = "mvv-utils";
const DEFAULT_STORE_NAME = "kv";
const DEFAULT_DB_VERSION = 1;
const BLOCKED_TIMEOUT_MS = 15_000;
const BLOCKED_RETRY_ATTEMPTS = 2;
const BLOCKED_RETRY_DELAY_MS = 250;
const BLOCKED_ERROR_MESSAGE = "Opening IndexedDB database is blocked by another tab/connection";

export class BrowserDbStorage {
    private readonly dbName: string;
    private readonly storeName: string;
    private readonly version: number;
    private readonly dbPromise: Promise<IDBDatabase>;

    constructor(options: BrowserDbStorageOptions = {}) {
        this.dbName = options.dbName ?? DEFAULT_DB_NAME;
        this.storeName = options.storeName ?? DEFAULT_STORE_NAME;
        this.version = options.version ?? DEFAULT_DB_VERSION;
        this.dbPromise = this.openDbWithRetry();
    }

    public async getItem(key: string): Promise<string | null> {
        return this.withStore("readonly", async (store) => {
            const res = await this.requestToPromise<string | undefined>(store.get(key));
            return res ?? null;
        });
    }

    public async setItem(key: string, value: string): Promise<void> {
        await this.withStore("readwrite", async (store) => {
            await this.requestToPromise(store.put(value, key));
        });
    }

    public async removeItem(key: string): Promise<void> {
        await this.withStore("readwrite", async (store) => {
            await this.requestToPromise(store.delete(key));
        });
    }

    public async key(index: number): Promise<string | null> {
        if (index < 0) {
            return null;
        }

        return this.withStore("readonly", async (store) => {
            return this.keyAtIndex(store, index);
        });
    }

    public async clear(): Promise<void> {
        await this.withStore("readwrite", async (store) => {
            await this.requestToPromise(store.clear());
        });
    }

    public async length(): Promise<number> {
        return this.withStore("readonly", (store) => this.requestToPromise<number>(store.count()));
    }

    public async close(): Promise<void> {
        const db = await this.dbPromise;
        db.close();
    }

    private async openDbWithRetry(): Promise<IDBDatabase> {
        let attemptsLeft = BLOCKED_RETRY_ATTEMPTS;

        // Retry blocked opens because other tabs may release connections moments later.
        // We only retry the blocked variant; other init failures should fail fast.
        while (true) {
            try {
                return await this.openDb();
            } catch (error) {
                if (
                    attemptsLeft > 0 &&
                    error instanceof WebStorageInitializationError &&
                    error.message.includes(BLOCKED_ERROR_MESSAGE)
                ) {
                    attemptsLeft -= 1;
                    await this.wait(BLOCKED_RETRY_DELAY_MS);
                    continue;
                }
                throw error;
            }
        }
    }

    private async openDb(): Promise<IDBDatabase> {
        if (typeof indexedDB === "undefined") {
            throw new WebStorageUnavailableError("IndexedDB is not available in this environment");
        }

        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            let blockedTimeoutId: ReturnType<typeof setTimeout> | null = null;
            let didTimeout = false;

            const clearBlockedTimer = (): void => {
                if (blockedTimeoutId) {
                    clearTimeout(blockedTimeoutId);
                    blockedTimeoutId = null;
                }
            };

            request.onerror = () => {
                clearBlockedTimer();
                reject(
                    new WebStorageInitializationError(
                        `Failed to open IndexedDB database "${this.dbName}"`,
                        request.error,
                    ),
                );
            };

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onblocked = () => {
                if (blockedTimeoutId) {
                    return;
                }

                blockedTimeoutId = setTimeout(() => {
                    didTimeout = true;
                    reject(
                        new WebStorageInitializationError(
                            `${BLOCKED_ERROR_MESSAGE}: "${this.dbName}"`,
                        ),
                    );
                }, BLOCKED_TIMEOUT_MS);
            };

            request.onsuccess = () => {
                clearBlockedTimer();
                const db = request.result;
                if (didTimeout) {
                    db.close();
                    return;
                }
                db.onversionchange = () => {
                    db.close();
                };
                resolve(db);
            };
        });
    }

    private async withStore<T>(
        mode: IDBTransactionMode,
        run: (store: IDBObjectStore) => Promise<T> | T,
    ): Promise<T> {
        const db = await this.dbPromise;
        const tx = db.transaction(this.storeName, mode);
        const store = tx.objectStore(this.storeName);
        const result = await run(store);
        await this.transactionDone(tx);
        return result;
    }

    private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                reject(new WebStorageRequestError("IndexedDB request failed", request.error));
            };
        });
    }

    private transactionDone(transaction: IDBTransaction): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onabort = () => {
                reject(
                    new WebStorageTransactionError(
                        "IndexedDB transaction aborted",
                        transaction.error,
                    ),
                );
            };
            transaction.onerror = () => {
                reject(
                    new WebStorageTransactionError(
                        "IndexedDB transaction failed",
                        transaction.error,
                    ),
                );
            };
        });
    }

    private keyAtIndex(store: IDBObjectStore, index: number): Promise<string | null> {
        return new Promise<string | null>((resolve, reject) => {
            const request = store.openKeyCursor();

            request.onerror = () => {
                reject(new WebStorageRequestError("IndexedDB key cursor request failed", request.error));
            };

            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) {
                    resolve(null);
                    return;
                }

                if (index === 0) {
                    const currentKey = cursor.key;
                    resolve(
                        typeof currentKey === "string"
                            ? currentKey
                            : currentKey != null
                              ? String(currentKey)
                              : null,
                    );
                    return;
                }

                try {
                    cursor.advance(index);
                    request.onsuccess = () => {
                        const advanced = request.result;
                        if (!advanced) {
                            resolve(null);
                            return;
                        }
                        const currentKey = advanced.key;
                        resolve(
                            typeof currentKey === "string"
                                ? currentKey
                                : currentKey != null
                                  ? String(currentKey)
                                  : null,
                        );
                    };
                } catch (error) {
                    reject(
                        new WebStorageRequestError(
                            `Failed to advance key cursor to index ${index}`,
                            error,
                        ),
                    );
                }
            };
        });
    }

    private wait(ms: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

export default BrowserDbStorage;
