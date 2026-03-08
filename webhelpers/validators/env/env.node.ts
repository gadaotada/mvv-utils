import type { ResultGeneral } from "../../types";
import {
    type EnvSchema,
    type EnvValidationError,
    type InferEnvData,
    type ValidateEnvOptions,
    validateEnv,
} from "./general";

export type ValidateNodeEnvResult<TSchema extends EnvSchema> = ResultGeneral<
    InferEnvData<TSchema>,
    EnvValidationError
>;

export function validateNodeEnv<TSchema extends EnvSchema>(
    schema: TSchema,
    options?: ValidateEnvOptions,
): ValidateNodeEnvResult<TSchema> {
    const env =
        typeof process !== "undefined"
            ? (process.env as Record<string, string | undefined>)
            : {};

    return validateEnv(schema, env, options);
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
