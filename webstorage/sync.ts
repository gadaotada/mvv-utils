import {
    checkLocalStorage,
    checkSessionStorage,
    WebStorageInitializationError,
    WebStorageSerializationError,
    WebStorageUnavailableError,
} from "./errors";
import {
    OBFUSCATION_PREFIX,
    parseObject,
    stringifyObject,
    SyncWebStorageType,
    WebStorageObfuscationOptions,
    xorBase64ToString,
    xorStringToBase64,
} from "./general";
import { MemoryStorage } from "./memory";

export type SyncWebStorageOptions = {
    type: SyncWebStorageType;
    fallbackToMemory?: boolean;
    warnOnFallback?: boolean;
    obfuscate?: WebStorageObfuscationOptions;
    autoCleanupCorrupted?: boolean;
};

export class SyncWebStorage {
    private readonly store: Storage;
    private readonly obfuscateConfig?: WebStorageObfuscationOptions;
    private readonly autoCleanupCorrupted: boolean;

    constructor(options: SyncWebStorageOptions) {
        this.store = this.initStore(options);
        this.obfuscateConfig = options.obfuscate;
        this.autoCleanupCorrupted = options.autoCleanupCorrupted ?? true;
        this.assertObfuscationConfig();
    }

    public getItem(key: string): string | null {
        const raw = this.store.getItem(key);
        const value = this.decodeValue(raw, key);

        if (
            this.autoCleanupCorrupted &&
            raw != null &&
            value == null &&
            this.obfuscateConfig?.enabled &&
            raw.startsWith(OBFUSCATION_PREFIX)
        ) {
            this.store.removeItem(key);
        }

        return value;
    }

    public getObject<TValue>(key: string): TValue | null {
        const raw = this.getItem(key);
        const parsed = parseObject<TValue>(raw, key);

        if (this.autoCleanupCorrupted && parsed.failed) {
            this.store.removeItem(key);
        }

        return parsed.value;
    }

    public setItem(key: string, value: string): void {
        const payload = this.encodeValue(value, key);
        if (!payload) return;

        this.store.setItem(key, payload);
    }

    public setObject<TValue>(key: string, value: TValue): void {
        const payload = stringifyObject(value, key);
        if (!payload) return;

        this.setItem(key, payload);
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

    private assertObfuscationConfig(): void {
        if (!this.obfuscateConfig?.enabled) {
            return;
        }

        if (!this.obfuscateConfig.key) {
            throw new WebStorageInitializationError(
                "Obfuscation is enabled but no obfuscation key was provided",
            );
        }
    }

    private encodeValue(value: string, key: string): string | null {
        if (!this.obfuscateConfig?.enabled) return value;

        try {
            return OBFUSCATION_PREFIX + xorStringToBase64(value, this.obfuscateConfig.key);
        } catch (error) {
            const reason = new WebStorageSerializationError(
                `Failed to obfuscate value for key "${key}"`,
                error,
            );
            console.error(reason);
            return null;
        }
    }

    private decodeValue(value: string | null, key: string): string | null {
        if (value == null) return null;

        if (!this.obfuscateConfig?.enabled || !value.startsWith(OBFUSCATION_PREFIX)) return value;

        const payload = value.slice(OBFUSCATION_PREFIX.length);
        try {
            return xorBase64ToString(payload, this.obfuscateConfig.key);
        } catch (error) {
            const reason = new WebStorageSerializationError(
                `Failed to deobfuscate value for key "${key}"`,
                error,
            );
            console.error(reason);
            return null;
        }
    }
}
