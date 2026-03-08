import type { ResultGeneral } from "../../types";
import {
    type EnvFieldConfig,
    type EnvSchema,
    type EnvValidationError,
    type InferEnvData,
    type ValidateEnvOptions,
    validateEnv,
} from "./general";

export type ViteEnvSchema = Record<`VITE_${string}`, EnvFieldConfig>;

export type ValidateViteEnvResult<TSchema extends EnvSchema> = ResultGeneral<
    InferEnvData<TSchema>,
    EnvValidationError
>;

export function validateViteEnv<TSchema extends ViteEnvSchema>(
    schema: TSchema,
    env: Record<string, string | undefined>,
    options?: ValidateEnvOptions,
): ValidateViteEnvResult<TSchema> {
    if (!Object.keys(schema).every((key) => key.startsWith("VITE_"))) {
        return {
            data: null,
            error: {
                name: "EnvValidationError",
                message: "Vite schema keys must start with VITE_",
                issues: [
                    {
                        key: "*",
                        reason: "schema contains non-VITE_ keys",
                    },
                ],
            },
        };
    }

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
