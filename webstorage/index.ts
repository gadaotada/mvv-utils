export { SyncWebStorage } from "./sync";
export { isWebStorageError } from "./errors";

export type {
    AsyncWebStorageType,
    SyncWebStorageType,
    WebStorageObfuscationOptions,
    WebStorageType,
} from "./general";
export type { SyncWebStorageOptions } from "./sync";
import type { SyncWebStorageOptions } from "./sync";

export type WebStorageOptions = SyncWebStorageOptions;
