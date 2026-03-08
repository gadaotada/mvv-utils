# webstorage examples

## Imports

```ts
import {
  SyncWebStorage,
  isWebStorageError,
  type SyncWebStorageOptions,
} from "../webstorage";
```

## 1. Safe sync storage factory (local/session/memory)

```ts
function createSyncStore(options: SyncWebStorageOptions) {
  try {
    return new SyncWebStorage(options);
  } catch (error) {
    if (isWebStorageError(error)) {
      console.error(error.code, error.message);
    } else {
      console.error("Unknown storage init error", error);
    }
    return null;
  }
}

const localStore = createSyncStore({
  type: "local",
  fallbackToMemory: true,
  warnOnFallback: true,
  autoCleanupCorrupted: true,
  obfuscate: {
    enabled: true,
    key: "my-local-key-v1",
  },
});
```

## 2. Sync string APIs

```ts
localStore?.setItem("theme", "dark");
const theme = localStore?.getItem("theme");

localStore?.removeItem("theme");
const len = localStore?.length();
const firstKey = localStore?.key(0);
```

## 3. Sync object APIs

```ts
type User = { id: number; name: string; roles: string[] };

localStore?.setObject<User>("user", {
  id: 1,
  name: "mvv",
  roles: ["admin"],
});

const user = localStore?.getObject<User>("user");
```

## Notes

- `fallbackToMemory: true` prevents init crashes when browser storage is unavailable.
- `obfuscate` is obfuscation, not real encryption.
- `autoCleanupCorrupted` removes bad payloads after parse/decode failures.
