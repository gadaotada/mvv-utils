function getProbeKey(prefix: string): string {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return `${prefix}_${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function canUseStorage(storage: Storage | undefined): boolean {
    if (!storage) return false;

    const key = getProbeKey("__websetup_probe__");
    try {
        storage.setItem(key, "1");
        storage.getItem(key);
        storage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

export function isLocalStorageAvailable(): boolean {
    try {
        return canUseStorage(globalThis.localStorage);
    } catch {
        return false;
    }
}

export function isSessionStorageAvailable(): boolean {
    try {
        return canUseStorage(globalThis.sessionStorage);
    } catch {
        return false;
    }
}

function getIndexedDbProbeName(): string {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return `websetup_idb_probe_${globalThis.crypto.randomUUID()}`;
    }
    return `websetup_idb_probe_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function isIndexedDbAvailable(): Promise<boolean> {
    if (typeof indexedDB === "undefined" || indexedDB === null) {
        return false;
    }

    const dbName = getIndexedDbProbeName();

    return new Promise<boolean>((resolve) => {
        let settled = false;
        const settle = (value: boolean): void => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        let request: IDBOpenDBRequest;
        try {
            request = indexedDB.open(dbName, 1);
        } catch {
            settle(false);
            return;
        }

        request.onerror = () => {
            settle(false);
        };

        request.onblocked = () => {
            settle(false);
        };

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("probe")) {
                db.createObjectStore("probe");
            }
        };

        request.onsuccess = () => {
            try {
                const db = request.result;
                const tx = db.transaction("probe", "readwrite");
                const store = tx.objectStore("probe");
                store.put("1", "k");

                tx.oncomplete = () => {
                    db.close();
                    indexedDB.deleteDatabase(dbName);
                    settle(true);
                };

                tx.onerror = () => {
                    db.close();
                    indexedDB.deleteDatabase(dbName);
                    settle(false);
                };

                tx.onabort = () => {
                    db.close();
                    indexedDB.deleteDatabase(dbName);
                    settle(false);
                };
            } catch {
                settle(false);
            }
        };
    });
}

export function isStorageQuotaExceededError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const maybe = error as { name?: unknown; code?: unknown };
    return (
        maybe.name === "QuotaExceededError" ||
        maybe.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        maybe.code === 22 ||
        maybe.code === 1014
    );
}

export function isStorageEstimateAvailable(): boolean {
    return typeof navigator !== "undefined" && !!navigator.storage?.estimate;
}

export function isStoragePersistenceAvailable(): boolean {
    return typeof navigator !== "undefined" && !!navigator.storage?.persist;
}
