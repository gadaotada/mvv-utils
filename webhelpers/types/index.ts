/**
 * Flattens intersections and mapped object types for cleaner IDE hovers.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * String "false" representation used by some APIs and query params.
 */
export type StrBoolFalse = "0";
/**
 * String "true" representation used by some APIs and query params.
 */
export type StrBoolTrue = "1";
/**
 * Boolean represented as a string literal union: "1" | "0".
 */
export type StrBool = StrBoolTrue | StrBoolFalse;

/**
 * Numeric "false" representation.
 */
export type NumBoolFalse = 0;
/**
 * Numeric "true" representation.
 */
export type NumBoolTrue = 1;
/**
 * Boolean represented as a numeric literal union: 1 | 0.
 */
export type NumBool = NumBoolTrue | NumBoolFalse;

/**
 * Broad boolean-like input type accepted by conversion helpers.
 */
export type BooleanLike = boolean | StrBool | NumBool;

/**
 * Data-first result shape:
 * - success: { data: T, error: null }
 * - failure: { data: null, error: E }
 */
export type ResultGeneral<T, E extends object = Record<string, unknown>> =
  | { data: T; error: null }
  | { data: null; error: E };

/**
 * Nullable helper for values that may be missing at runtime.
 */
export type Maybe<T> = T | null | undefined;

/**
 * Generic function type helper.
 */
export type Fn<TArgs extends unknown[] = unknown[], TReturn = void> = (...args: TArgs) => TReturn;

/**
 * Extracts the item type from an array/readonly array.
 */
export type UnwrapArray<T> = T extends readonly (infer TItem)[] ? TItem : T;

/**
 * Extracts the resolved type from a Promise-like value.
 */
export type UnwrapPromise<T> = T extends PromiseLike<infer TValue> ? TValue : T;
