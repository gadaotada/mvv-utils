export type WebStorageErrorCode =
    | "UNAVAILABLE"
    | "INITIALIZATION_FAILED"
    | "REQUEST_FAILED"
    | "TRANSACTION_FAILED"
    | "SERIALIZATION_FAILED";

const WEB_STORAGE_ERROR_CODES: readonly WebStorageErrorCode[] = [
    "UNAVAILABLE",
    "INITIALIZATION_FAILED",
    "REQUEST_FAILED",
    "TRANSACTION_FAILED",
    "SERIALIZATION_FAILED",
];

export class WebStorageError extends Error {
    public readonly code: WebStorageErrorCode;
    public readonly cause?: unknown;

    constructor(code: WebStorageErrorCode, message: string, cause?: unknown) {
        super(message);
        this.name = "WebStorageError";
        this.code = code;
        this.cause = cause;

        const capture = (
            Error as ErrorConstructor & {
                captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
            }
        ).captureStackTrace;

        if (capture) {
            capture(this, new.target);
        } else if (!this.stack) {
            this.stack = new Error(message).stack;
        }
    }
}

export class WebStorageUnavailableError extends WebStorageError {
    constructor(message = "Web storage is not available", cause?: unknown) {
        super("UNAVAILABLE", message, cause);
        this.name = "WebStorageUnavailableError";
    }
}

export class WebStorageInitializationError extends WebStorageError {
    constructor(message = "Failed to initialize web storage", cause?: unknown) {
        super("INITIALIZATION_FAILED", message, cause);
        this.name = "WebStorageInitializationError";
    }
}

export class WebStorageRequestError extends WebStorageError {
    constructor(message = "Web storage request failed", cause?: unknown) {
        super("REQUEST_FAILED", message, cause);
        this.name = "WebStorageRequestError";
    }
}

export class WebStorageTransactionError extends WebStorageError {
    constructor(message = "Web storage transaction failed", cause?: unknown) {
        super("TRANSACTION_FAILED", message, cause);
        this.name = "WebStorageTransactionError";
    }
}

export class WebStorageSerializationError extends WebStorageError {
    constructor(message = "Web storage serialization failed", cause?: unknown) {
        super("SERIALIZATION_FAILED", message, cause);
        this.name = "WebStorageSerializationError";
    }
}

export function isWebStorageError(error: unknown): error is WebStorageError {
    if (error instanceof WebStorageError) {
        return true;
    }

    if (!error || typeof error !== "object") {
        return false;
    }

    const maybeError = error as { name?: unknown; code?: unknown; message?: unknown };
    const hasKnownName =
        typeof maybeError.name === "string" && maybeError.name.startsWith("WebStorage");
    const hasKnownCode =
        typeof maybeError.code === "string" &&
        WEB_STORAGE_ERROR_CODES.includes(maybeError.code as WebStorageErrorCode);

    return hasKnownName && hasKnownCode && typeof maybeError.message === "string";
}

function canUseStorage(storage: Storage | undefined): boolean {
    if (!storage) {
        return false;
    }

    const checkKey = createProbeKey();
    try {
        storage.setItem(checkKey, "1");
        storage.getItem(checkKey);
        storage.removeItem(checkKey);
        return true;
    } catch {
        return false;
    }
}

function createProbeKey(): string {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return `__ws_probe_${globalThis.crypto.randomUUID()}`;
    }

    return `__ws_probe_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function checkLocalStorage(): boolean {
    try {
        return canUseStorage(globalThis.localStorage);
    } catch {
        return false;
    }
}

export function checkSessionStorage(): boolean {
    try {
        return canUseStorage(globalThis.sessionStorage);
    } catch {
        return false;
    }
}
