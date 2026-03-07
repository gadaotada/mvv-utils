import BrowserDbStorage, { BrowserDbStorageOptions } from "./db";
import {
    checkLocalStorage,
    checkSessionStorage,
    WebStorageSerializationError,
    WebStorageUnavailableError,
} from "./errors";
import { MemoryStorage } from "./memory";

type SyncWebStorageType = "memory" | "session" | "local";
type AsyncWebStorageType = "database";
type WebStorageType = SyncWebStorageType | AsyncWebStorageType;

type SyncWebStorageOptions = {
    type: SyncWebStorageType;
    fallbackToMemory?: boolean;
    warnOnFallback?: boolean;
};

type AsyncWebStorageOptions = {
    type?: AsyncWebStorageType;
    dbConfig?: BrowserDbStorageOptions;
    fallbackToMemory?: boolean;
    warnOnFallback?: boolean;
};

type WebStorageOptions = SyncWebStorageOptions | AsyncWebStorageOptions;

class SyncWebStorage {
    private readonly store: Storage;

    constructor(options: SyncWebStorageOptions) {
        this.store = this.initStore(options);
    }

    public getItem(key: string): string | null {
        return this.store.getItem(key);
    }

    public getObject<TValue>(key: string): TValue | null {
        return parseObject<TValue>(this.store.getItem(key), key);
    }

    public setItem(key: string, value: string): void {
        this.store.setItem(key, value);
    }

    public setObject<TValue>(key: string, value: TValue): void {
        this.store.setItem(key, stringifyObject(value, key));
    }

    public removeItem(key: string): void {
        this.store.removeItem(key);
    }

    public key(index: number): string | null {
        return this.store.key(index);
    }

    public clear(): void {
        this.store.clear();
    }

    public length(): number {
        return this.store.length;
    }

    private initStore(options: SyncWebStorageOptions): Storage {
        const fallbackToMemory = options.fallbackToMemory ?? true;
        const warnOnFallback = options.warnOnFallback ?? true;

        switch (options.type) {
            case "memory":
                return new MemoryStorage();

            case "local":
                if (checkLocalStorage()) {
                    return globalThis.localStorage;
                }
                if (!fallbackToMemory) {
                    throw new WebStorageUnavailableError(
                        "Local storage is not available in this environment",
                    );
                }
                if (warnOnFallback) {
                    console.warn("Local storage not available, falling back to in-memory store...");
                }
                return new MemoryStorage();

            case "session":
                if (checkSessionStorage()) {
                    return globalThis.sessionStorage;
                }
                if (!fallbackToMemory) {
                    throw new WebStorageUnavailableError(
                        "Session storage is not available in this environment",
                    );
                }
                if (warnOnFallback) {
                    console.warn("Session storage not available, falling back to in-memory store...");
                }
                return new MemoryStorage();
        }
    }
}

class AsyncWebStorage {
    private readonly store: BrowserDbStorage | MemoryStorage;

    constructor(options: AsyncWebStorageOptions = {}) {
        this.store = this.initStore(options);
    }

    public getItem(key: string): Promise<string | null> {
        if (this.store instanceof BrowserDbStorage) {
            return this.store.getItem(key);
        }
        return Promise.resolve(this.store.getItem(key));
    }

    public getObject<TValue>(key: string): Promise<TValue | null> {
        return this.getItem(key).then((raw) => parseObject<TValue>(raw, key));
    }

    public setItem(key: string, value: string): Promise<void> {
        if (this.store instanceof BrowserDbStorage) {
            return this.store.setItem(key, value);
        }
        this.store.setItem(key, value);
        return Promise.resolve();
    }

    public setObject<TValue>(key: string, value: TValue): Promise<void> {
        return this.setItem(key, stringifyObject(value, key));
    }

    public removeItem(key: string): Promise<void> {
        if (this.store instanceof BrowserDbStorage) {
            return this.store.removeItem(key);
        }
        this.store.removeItem(key);
        return Promise.resolve();
    }

    public key(index: number): Promise<string | null> {
        if (this.store instanceof BrowserDbStorage) {
            return this.store.key(index);
        }
        return Promise.resolve(this.store.key(index));
    }

    public clear(): Promise<void> {
        if (this.store instanceof BrowserDbStorage) {
            return this.store.clear();
        }
        this.store.clear();
        return Promise.resolve();
    }

    public length(): Promise<number> {
        if (this.store instanceof BrowserDbStorage) {
            return this.store.length();
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
}

function stringifyObject<TValue>(value: TValue, key: string): string {
    try {
        const serialized = JSON.stringify(value);
        if (serialized === undefined) {
            throw new TypeError("Value is not JSON-serializable");
        }
        return serialized;
    } catch (error) {
        throw new WebStorageSerializationError(
            `Failed to serialize object for key "${key}"`,
            error,
        );
    }
}

function parseObject<TValue>(value: string | null, key: string): TValue | null {
    if (value == null) {
        return null;
    }

    try {
        return JSON.parse(value) as TValue;
    } catch (error) {
        throw new WebStorageSerializationError(
            `Failed to parse stored object for key "${key}"`,
            error,
        );
    }
}

export { AsyncWebStorage, SyncWebStorage };
export type {
    AsyncWebStorageOptions,
    AsyncWebStorageType,
    SyncWebStorageOptions,
    SyncWebStorageType,
    WebStorageOptions,
    WebStorageType,
};
