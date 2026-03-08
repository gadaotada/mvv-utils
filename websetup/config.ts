export type RequirementRule = boolean | { enabled?: boolean; message?: string };

type OptionalRecord<TKey extends string, TValue> = Partial<Record<TKey, TValue>>;

export type StorageVariants = "localStorage" | "sessionStorage" | "indexedDb";
export type StorageRequirements = OptionalRecord<StorageVariants, RequirementRule>;

export type CookieVariants = "cookiesEnabled" | "sessionCookies" | "partitionedCookies" | "sameSiteNone";
export type CookieRequirements = OptionalRecord<CookieVariants, RequirementRule>;

export type RuntimeVariants = "broadcastChannel" | "serviceWorker" | "cacheApi" | "webLocks";
export type RuntimeRequirements = OptionalRecord<RuntimeVariants, RequirementRule>;

export type CustomRequirement = {
    enabled?: boolean;
    message?: string;
    check: () => boolean | Promise<boolean>;
};

export type WebRequirementsConfig = {
    storage?: StorageRequirements;
    cookies?: CookieRequirements;
    runtime?: RuntimeRequirements;
    custom?: Record<string, CustomRequirement>;
};

export type FailedRequirement = {
    id: string;
    message: string;
};

export type RequirementResult = {
    id: string;
    ok: boolean;
    message: string;
};
