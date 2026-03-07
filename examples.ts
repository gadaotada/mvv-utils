import { AsyncWebStorage, isWebStorageError, SyncWebStorage } from "./webstorage";
import type { SyncWebStorageOptions } from "./webstorage";

// Example 1
function factorySyncWebStore(ops: SyncWebStorageOptions) {
    try {
        return new SyncWebStorage(ops);
    } catch (err) {
        if (isWebStorageError(err)) {
            //toast.error(err.cause)
        } else {
            //toast.error("General error")
        }

        return null;
    }
}

const webLocalStore = factorySyncWebStore({ type: "local", fallbackToMemory: true });
const webDbStore = new AsyncWebStorage();

webLocalStore?.getObject("my-object");
webLocalStore?.setObject("my-object", { id: 1, value: "some-value", settings: [] });

async function runDatabaseExample() {
    await webDbStore?.getObject("db-object");
    await webDbStore?.length();
}

void runDatabaseExample();

// Example 2
function createSessionStore() {
    try {
        return new SyncWebStorage({ type: "session" });
    } catch (err) {
        if (isWebStorageError(err)) {
            //toast.error(err.cause)
        } else {
            //toast.error("General error")
        }

        return null;
    }
}

function createMemoryStore() {
    return new SyncWebStorage({ type: "memory" });
}

const appStore = {
    session: createSessionStore(),
    memory: createMemoryStore(),
};

appStore.session?.getItem("my-key");
appStore.memory.getItem("some-item");
