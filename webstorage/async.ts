import BrowserDbStorage, { BrowserDbStorageOptions } from "./db";
import { parseObject, stringifyObject } from "./general";
import { MemoryStorage } from "./memory";
import { WebStorageUnavailableError } from "./errors";

export type AsyncWebStorageOptions = {
    dbConfig?: BrowserDbStorageOptions;
    fallbackToMemory?: boolean;
    warnOnFallback?: boolean;
    autoCleanupCorrupted?: boolean;
};

export class AsyncWebStorage {
    private store: BrowserDbStorage | MemoryStorage;
    private readonly autoCleanupCorrupted: boolean;
    private readonly fallbackToMemory: boolean;
    private readonly warnOnFallback: boolean;
    private didRuntimeFallback = false;

    constructor(options: AsyncWebStorageOptions = {}) {
        this.store = this.initStore(options);
        this.autoCleanupCorrupted = options.autoCleanupCorrupted ?? true;
        this.fallbackToMemory = options.fallbackToMemory ?? true;
        this.warnOnFallback = options.warnOnFallback ?? true;
    }

    public getItem(key: string): Promise<string | null> {
        if (this.store instanceof BrowserDbStorage) {
            const dbStore = this.store;
            return this.runWithRuntimeFallback(
                () => dbStore.getItem(key),
                (memoryStore) => memoryStore.getItem(key),
            );
        }
        return Promise.resolve(this.store.getItem(key));
    }

    public async getObject<TValue>(key: string): Promise<TValue | null> {
        const raw = await this.getItem(key);
        const parsed = parseObject<TValue>(raw, key);

        if (this.autoCleanupCorrupted && parsed.failed) {
            await this.removeItem(key);
        }

        return parsed.value;
    }

    public setItem(key: string, value: string): Promise<void> {
        if (this.store instanceof BrowserDbStorage) {
            const dbStore = this.store;
            return this.runWithRuntimeFallback(
                () => dbStore.setItem(key, value),
                (memoryStore) => memoryStore.setItem(key, value),
            );
        }
        this.store.setItem(key, value);
        return Promise.resolve();
    }

    public setObject<TValue>(key: string, value: TValue): Promise<void> {
        const payload = stringifyObject(value, key);
        if (!payload) return Promise.resolve();

        return this.setItem(key, payload);
    }

    public removeItem(key: string): Promise<void> {
        if (this.store instanceof BrowserDbStorage) {
            const dbStore = this.store;
            return this.runWithRuntimeFallback(
                () => dbStore.removeItem(key),
                (memoryStore) => memoryStore.removeItem(key),
            );
        }
        this.store.removeItem(key);
        return Promise.resolve();
    }

    public key(index: number): Promise<string | null> {
        if (this.store instanceof BrowserDbStorage) {
            const dbStore = this.store;
            return this.runWithRuntimeFallback(
                () => dbStore.key(index),
                (memoryStore) => memoryStore.key(index),
            );
        }
        return Promise.resolve(this.store.key(index));
    }

    public clear(): Promise<void> {
        if (this.store instanceof BrowserDbStorage) {
            const dbStore = this.store;
            return this.runWithRuntimeFallback(
                () => dbStore.clear(),
                (memoryStore) => memoryStore.clear(),
            );
        }
        this.store.clear();
        return Promise.resolve();
    }

    public length(): Promise<number> {
        if (this.store instanceof BrowserDbStorage) {
            const dbStore = this.store;
            return this.runWithRuntimeFallback(
                () => dbStore.length(),
                (memoryStore) => memoryStore.length,
            );
        }
        return Promise.resolve(this.store.length);
    }

    public async close(): Promise<void> {
        if (this.store instanceof BrowserDbStorage) {
            await this.store.close();
        }
    }

    private initStore(options: AsyncWebStorageOptions): BrowserDbStorage | MemoryStorage {
        const fallbackToMemory = options.fallbackToMemory ?? true;
        const warnOnFallback = options.warnOnFallback ?? true;

        if (typeof indexedDB !== "undefined") {
            return new BrowserDbStorage(options.dbConfig);
        }

        if (!fallbackToMemory) {
            throw new WebStorageUnavailableError("IndexedDB is not available in this environment");
        }

        if (warnOnFallback) {
            console.warn("IndexedDB not available, falling back to in-memory store...");
        }
        return new MemoryStorage();
    }

    private async runWithRuntimeFallback<TValue>(
        dbOperation: () => Promise<TValue>,
        memoryOperation: (memoryStore: MemoryStorage) => TValue | Promise<TValue>,
    ): Promise<TValue> {
        try {
            return await dbOperation();
        } catch (error) {
            if (!this.fallbackToMemory) {
                throw error;
            }

            const memoryStore = await this.switchToMemoryStore();
            return await memoryOperation(memoryStore);
        }
    }

    private async switchToMemoryStore(): Promise<MemoryStorage> {
        if (this.store instanceof BrowserDbStorage) {
            try {
                await this.store.close();
            } catch {
                // ignore close errors while switching fallback
            }
        }

        if (!(this.store instanceof MemoryStorage)) {
            this.store = new MemoryStorage();
        }

        if (this.warnOnFallback && !this.didRuntimeFallback) {
            this.didRuntimeFallback = true;
            console.warn("IndexedDB operation failed, falling back to in-memory store...");
        }

        return this.store;
    }
}
