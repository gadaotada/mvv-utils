import type { Prettify, ResultGeneral } from "../../types";

export type EnvValueType = "string" | "number" | "boolean";

type EnvTypeMap = {
    string: string;
    number: number;
    boolean: boolean;
};

type EnvFieldConfigBase<TType extends EnvValueType> = {
    type: TType;
    default?: EnvTypeMap[TType] | null;
    validationFn?: ((value: EnvTypeMap[TType]) => boolean) | null;
};

export type EnvFieldConfig<TType extends EnvValueType = EnvValueType> = TType extends EnvValueType
    ? EnvFieldConfigBase<TType>
    : never;

export type EnvSchema = Record<string, EnvFieldConfig>;

type InferFieldValue<TField extends EnvFieldConfig> = TField extends EnvFieldConfig<infer TType>
    ? TType extends keyof EnvTypeMap
        ? EnvTypeMap[TType]
        : never
    : never;

export type InferEnvData<TSchema extends EnvSchema> = Prettify<{
    [TKey in keyof TSchema]: InferFieldValue<TSchema[TKey]>;
}>;

export type EnvValidationIssue = {
    key: string;
    reason: string;
    rawValue?: string | undefined;
};

export type EnvValidationError = {
    name: "EnvValidationError";
    message: string;
    issues: EnvValidationIssue[];
};

export type ValidateEnvOptions = {
    failFast?: boolean;
    trimStringValues?: boolean;
};

type RawEnv = Record<string, string | undefined>;

export function validateEnv<TSchema extends EnvSchema>(
    schema: TSchema,
    env: RawEnv,
    options: ValidateEnvOptions = {},
): ResultGeneral<InferEnvData<TSchema>, EnvValidationError> {
    const failFast = options.failFast ?? false;
    const trimStringValues = options.trimStringValues ?? true;

    const parsed: Partial<InferEnvData<TSchema>> = {};
    const issues: EnvValidationIssue[] = [];

    for (const key of Object.keys(schema) as (keyof TSchema)[]) {
        const field = schema[key];
        const rawOriginal = env[String(key)];
        const raw = trimStringValues ? rawOriginal?.trim() : rawOriginal;

        const parsedValue = resolveFieldValue(field, raw);
        if ("reason" in parsedValue) {
            issues.push({
                key: String(key),
                reason: parsedValue.reason,
                rawValue: rawOriginal,
            });
            if (failFast) {
                break;
            }
            continue;
        }

        const validator = field.validationFn as ((value: unknown) => boolean) | null | undefined;
        if (validator && !validator(parsedValue.value)) {
            issues.push({
                key: String(key),
                reason: "custom validation failed",
                rawValue: rawOriginal,
            });
            if (failFast) {
                break;
            }
            continue;
        }

        parsed[key] = parsedValue.value as InferEnvData<TSchema>[typeof key];
    }

    if (issues.length > 0) {
        return {
            data: null,
            error: {
                name: "EnvValidationError",
                message: "Environment validation failed",
                issues,
            },
        };
    }

    return {
        data: parsed as InferEnvData<TSchema>,
        error: null,
    };
}

function resolveFieldValue(
    field: EnvFieldConfig,
    rawValue: string | undefined,
): { ok: true; value: string | number | boolean } | { ok: false; reason: string } {
    const hasRawValue = rawValue != null && rawValue.length > 0;

    if (!hasRawValue) {
        if (field.default !== undefined && field.default !== null) {
            return { ok: true, value: field.default };
        }
        return { ok: false, reason: "missing value and no default provided" };
    }

    switch (field.type) {
        case "string":
            return { ok: true, value: rawValue };

        case "number": {
            const parsed = Number(rawValue);
            if (!Number.isFinite(parsed)) {
                return { ok: false, reason: `expected number, got "${rawValue}"` };
            }
            return { ok: true, value: parsed };
        }

        case "boolean": {
            const normalized = rawValue.toLowerCase();
            if (["1", "true", "yes", "on"].includes(normalized)) {
                return { ok: true, value: true };
            }
            if (["0", "false", "no", "off"].includes(normalized)) {
                return { ok: true, value: false };
            }
            return { ok: false, reason: `expected boolean, got "${rawValue}"` };
        }
    }
}
