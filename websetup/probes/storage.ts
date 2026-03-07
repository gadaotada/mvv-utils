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

export function isIndexedDbAvailable(): boolean {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
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
