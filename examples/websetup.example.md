# websetup examples

## Imports

```ts
import {
  WebRequirements,
  checkWebRequirements,
  OfflineTracker,
  CONNECTION_STATUS,
  getSystemInfo,
  type WebRequirementsConfig,
} from "../websetup";
```

## 1. Define browser requirements

```ts
const requirementsConfig: WebRequirementsConfig = {
  storage: {
    localStorage: true,
    sessionStorage: true,
    indexedDb: { enabled: true, message: "Please enable IndexedDB for offline mode." },
  },
  cookies: {
    cookiesEnabled: true,
    sessionCookies: true,
    sameSiteNone: false,
    partitionedCookies: false,
  },
  runtime: {
    serviceWorker: true,
    cacheApi: true,
    broadcastChannel: false,
    webLocks: false,
  },
};
```

## 2. Use class API

```ts
const requirements = new WebRequirements(requirementsConfig);

if (!requirements.ok) {
  console.error(requirements.firstErrorMessage);
  console.table(requirements.failures);
}
```

## 3. Use boolean helper API

```ts
const isGood = checkWebRequirements(requirementsConfig);

if (!isGood) {
  // toast.error("Please allow required browser features for this app.");
}
```

## 4. Track online/offline

```ts
const tracker = new OfflineTracker();

const unsubscribe = tracker.subscribe((status, isOnline) => {
  if (status === CONNECTION_STATUS.offline) {
    console.warn("You are offline");
  }

  if (isOnline) {
    console.log("Back online");
  }
});

// Later, when no longer needed:
unsubscribe();
```

## 5. Get browser/system info

```ts
const system = getSystemInfo();

console.log(system.browser.name, system.browser.version);
console.log(system.os.name, system.os.platform);
console.log(system.device.type, system.device.touchPoints);
console.log(system.runtime.isSecureContext, system.runtime.timezone);
```

## Notes

- `new WebRequirements(config)` returns an object; check `requirements.ok`.
- `checkWebRequirements(config)` returns plain boolean for quick gating.
- Third-party cookie detection is intentionally conservative in first-party context.
