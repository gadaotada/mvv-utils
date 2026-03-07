export { AsyncWebStorage } from "./async";
export { SyncWebStorage } from "./sync";
export { isWebStorageError } from "./errors";

export type {
    AsyncWebStorageType,
    SyncWebStorageType,
    WebStorageObfuscationOptions,
    WebStorageType,
} from "./general";
export type { AsyncWebStorageOptions } from "./async";
export type { SyncWebStorageOptions } from "./sync";

import type { AsyncWebStorageOptions } from "./async";
import type { SyncWebStorageOptions } from "./sync";

export type WebStorageOptions = SyncWebStorageOptions | AsyncWebStorageOptions;
