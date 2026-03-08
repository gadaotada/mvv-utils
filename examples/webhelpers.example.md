# webhelpers examples

## Imports

```ts
import {
  validateNodeEnv,
  validateViteEnv,
  validateNextEnv,
  type EnvSchema,
  type ViteEnvSchema,
  type NextPublicEnvSchema,
} from "../webhelpers";
```

## 1. Node env validation

```ts
const nodeSchema = {
  DATABASE_URL: {
    type: "string",
    default: null,
    validationFn: (value: string) => value.startsWith("postgres://"),
  },
  PORT: {
    type: "number",
    default: 3000,
    validationFn: (value: number) => value > 0 && value <= 65535,
  },
  DEBUG: {
    type: "boolean",
    default: false,
    validationFn: null,
  },
} satisfies EnvSchema;

const nodeResult = validateNodeEnv(nodeSchema);
if (nodeResult.error) {
  console.error(nodeResult.error.issues);
} else {
  console.log(nodeResult.data.PORT, nodeResult.data.DEBUG);
}
```

## 2. Vite env validation (`VITE_` enforced)

```ts
const viteSchema = {
  VITE_BACKEND_URL: {
    type: "string",
    default: null,
    validationFn: (value: string) => value.startsWith("https://"),
  },
  VITE_ENABLE_ANALYTICS: {
    type: "boolean",
    default: false,
    validationFn: null,
  },
} satisfies ViteEnvSchema;

const viteResult = validateViteEnv(viteSchema, import.meta.env as Record<string, string | undefined>);
if (viteResult.error) {
  console.error(viteResult.error.issues);
}
```

## 3. Next.js public env validation (`NEXT_PUBLIC_` enforced)

```ts
const nextPublicSchema = {
  NEXT_PUBLIC_BACKEND_URL: {
    type: "string",
    default: null,
    validationFn: (value: string) => value.startsWith("https://"),
  },
} satisfies NextPublicEnvSchema;

const nextPublicResult = validateNextEnv(nextPublicSchema);
if (nextPublicResult.error) {
  console.error(nextPublicResult.error.issues);
}
```

## 4. Next.js server-only env

```ts
const nextServerSchema = {
  DATABASE_URL: {
    type: "string",
    default: null,
    validationFn: (value: string) => value.length > 0,
  },
} satisfies EnvSchema;

// Use node validator for server-only env in Next.js:
const nextServerResult = validateNodeEnv(nextServerSchema);
if (nextServerResult.error) {
  console.error(nextServerResult.error.issues);
}
```

