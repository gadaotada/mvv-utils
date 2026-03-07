# webstorage examples

## Imports

```ts
import {
  AsyncWebStorage,
  SyncWebStorage,
  isWebStorageError,
  type SyncWebStorageOptions,
  type AsyncWebStorageOptions,
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

## 4. Async storage (IndexedDB + memory fallback)

```ts
const asyncOptions: AsyncWebStorageOptions = {
  fallbackToMemory: true,
  warnOnFallback: true,
  autoCleanupCorrupted: true,
  dbConfig: {
    dbName: "my-app-db",
    storeName: "kv",
    version: 1,
  },
};

const dbStore = new AsyncWebStorage(asyncOptions);
```

## 5. Async string APIs

```ts
await dbStore.setItem("token", "abc-123");
const token = await dbStore.getItem("token");

await dbStore.removeItem("token");
const dbLen = await dbStore.length();
const dbKey = await dbStore.key(0);
```

## 6. Async object APIs

```ts
await dbStore.setObject("settings", {
  locale: "en",
  notifications: true,
});

const settings = await dbStore.getObject<{
  locale: string;
  notifications: boolean;
}>("settings");
```

## 7. Close IndexedDB store when needed

```ts
await dbStore.close();
```

## Notes

- `fallbackToMemory: true` prevents init crashes when browser storage is unavailable.
- `obfuscate` is obfuscation, not real encryption.
- `autoCleanupCorrupted` removes bad payloads after parse/decode failures.
