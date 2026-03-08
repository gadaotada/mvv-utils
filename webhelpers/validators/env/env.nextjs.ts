import type { ResultGeneral } from "../../types";
import {
    type EnvFieldConfig,
    type EnvSchema,
    type EnvValidationError,
    type InferEnvData,
    type ValidateEnvOptions,
    validateEnv,
} from "./general";

export type NextPublicEnvSchema = Record<`NEXT_PUBLIC_${string}`, EnvFieldConfig>;

export type ValidateNextEnvResult<TSchema extends EnvSchema> = ResultGeneral<
    InferEnvData<TSchema>,
    EnvValidationError
>;

export function validateNextEnv<TSchema extends NextPublicEnvSchema>(
    schema: TSchema,
    env?: Record<string, string | undefined>,
    options?: ValidateEnvOptions,
): ValidateNextEnvResult<TSchema> {
    if (!Object.keys(schema).every((key) => key.startsWith("NEXT_PUBLIC_"))) {
        return {
            data: null,
            error: {
                name: "EnvValidationError",
                message: "Next.js public schema keys must start with NEXT_PUBLIC_",
                issues: [
                    {
                        key: "*",
                        reason: "schema contains non-NEXT_PUBLIC_ keys",
                    },
                ],
            },
        };
    }

    const sourceEnv =
        env ??
        (typeof process !== "undefined"
            ? (process.env as Record<string, string | undefined>)
            : {});

    return validateEnv(schema, sourceEnv, options);
}

export type {
    EnvFieldConfig,
    EnvSchema,
    EnvValidationError,
    EnvValidationIssue,
    EnvValueType,
    InferEnvData,
    ValidateEnvOptions,
} from "./general";
