export { validateNodeEnv } from "./env.node";
export { validateViteEnv, type ViteEnvSchema } from "./env.vite";
export { validateNextEnv, type NextPublicEnvSchema } from "./env.nextjs";

export type {
    EnvFieldConfig,
    EnvSchema,
    EnvValidationError,
    EnvValidationIssue,
    EnvValueType,
    InferEnvData,
    ValidateEnvOptions,
} from "./general";
