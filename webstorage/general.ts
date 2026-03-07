import { WebStorageSerializationError } from "./errors";

export type SyncWebStorageType = "memory" | "session" | "local";
export type AsyncWebStorageType = "database";
export type WebStorageType = SyncWebStorageType | AsyncWebStorageType;

export type WebStorageObfuscationOptions = {
    enabled: boolean;
    key: string;
};

export type ParsedObjectResult<TValue> = {
    value: TValue | null;
    failed: boolean;
};

export function stringifyObject<TValue>(value: TValue, key: string): string | null {
    try {
        const serialized = JSON.stringify(value);
        if (serialized === undefined) {
            throw new TypeError("Value is not JSON-serializable");
        }
        return serialized;
    } catch (error) {
        const reason = new WebStorageSerializationError(
            `Failed to serialize object for key "${key}"`,
            error,
        );
        console.error(reason);
        return null;
    }
}

export function parseObject<TValue>(value: string | null, key: string): ParsedObjectResult<TValue> {
    if (value == null) {
        return { value: null, failed: false };
    }

    try {
        return { value: JSON.parse(value) as TValue, failed: false };
    } catch (error) {
        const reason = new WebStorageSerializationError(
            `Failed to parse stored object for key "${key}"`,
            error,
        );
        console.error(reason);
        return { value: null, failed: true };
    }
}

export const OBFUSCATION_PREFIX = "__ws_obf_v1__:";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function xorStringToBase64(value: string, key: string): string {
    const input = textEncoder.encode(value);
    const secret = textEncoder.encode(key);
    const output = new Uint8Array(input.length);

    for (let i = 0; i < input.length; i += 1) {
        output[i] = input[i] ^ secret[i % secret.length];
    }

    return bytesToBase64(output);
}

export function xorBase64ToString(value: string, key: string): string {
    const input = base64ToBytes(value);
    const secret = textEncoder.encode(key);
    const output = new Uint8Array(input.length);

    for (let i = 0; i < input.length; i += 1) {
        output[i] = input[i] ^ secret[i % secret.length];
    }

    return textDecoder.decode(output);
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
