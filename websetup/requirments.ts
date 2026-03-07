import type { FailedRequirement, RequirementRule, WebRequirementsConfig } from "./config";
import {
    areCookiesEnabled,
    arePartitionedCookiesSupported,
    areSessionCookiesAvailable,
    isSameSiteNoneCookieSupported,
} from "./probes/cookies";
import {
    isBroadcastChannelOperational,
    isCacheApiOperational,
    isServiceWorkerOperational,
    isWebLocksOperational,
} from "./probes/runtime";
import {
    isIndexedDbAvailable,
    isLocalStorageAvailable,
    isSessionStorageAvailable,
} from "./probes/storage";

function resolveRule(rule: RequirementRule | undefined): { enabled: boolean; message?: string } {
    if (rule == null) {
        return { enabled: false };
    }
    if (typeof rule === "boolean") {
        return { enabled: rule };
    }
    return { enabled: rule.enabled ?? true, message: rule.message };
}

export class WebRequirements {
    private readonly failedRequirements: FailedRequirement[];

    constructor(config: WebRequirementsConfig) {
        this.failedRequirements = [];
        this.evaluate(config);
    }

    public get ok(): boolean {
        return this.failedRequirements.length === 0;
    }

    public get failures(): FailedRequirement[] {
        return [...this.failedRequirements];
    }

    public get firstErrorMessage(): string | null {
        return this.failedRequirements[0]?.message ?? null;
    }

    private evaluate(config: WebRequirementsConfig): void {
        this.evaluateStorage(config);
        this.evaluateCookies(config);
        this.evaluateRuntime(config);
    }

    private evaluateStorage(config: WebRequirementsConfig): void {
        this.check(
            "storage.localStorage",
            resolveRule(config.storage?.localStorage),
            isLocalStorageAvailable,
            "Please enable local storage in order for this app to work.",
        );
        this.check(
            "storage.sessionStorage",
            resolveRule(config.storage?.sessionStorage),
            isSessionStorageAvailable,
            "Please enable session storage in order for this app to work.",
        );
        this.check(
            "storage.indexedDb",
            resolveRule(config.storage?.indexedDb),
            isIndexedDbAvailable,
            "Please enable IndexedDB in order for this app to work.",
        );
    }

    private evaluateCookies(config: WebRequirementsConfig): void {
        this.check(
            "cookies.cookiesEnabled",
            resolveRule(config.cookies?.cookiesEnabled),
            areCookiesEnabled,
            "Please enable cookies in order for this app to work.",
        );
        this.check(
            "cookies.sessionCookies",
            resolveRule(config.cookies?.sessionCookies),
            areSessionCookiesAvailable,
            "Please enable session cookies in order for this app to work.",
        );
        this.check(
            "cookies.partitionedCookies",
            resolveRule(config.cookies?.partitionedCookies),
            arePartitionedCookiesSupported,
            "Please use a browser that supports partitioned cookies for this app.",
        );
        this.check(
            "cookies.sameSiteNone",
            resolveRule(config.cookies?.sameSiteNone),
            isSameSiteNoneCookieSupported,
            "Please use a browser that supports SameSite=None cookies for this app.",
        );
    }

    private evaluateRuntime(config: WebRequirementsConfig): void {
        this.check(
            "runtime.broadcastChannel",
            resolveRule(config.runtime?.broadcastChannel),
            isBroadcastChannelOperational,
            "Please use a browser that supports BroadcastChannel for this app.",
        );
        this.check(
            "runtime.serviceWorker",
            resolveRule(config.runtime?.serviceWorker),
            isServiceWorkerOperational,
            "Please use a browser that supports Service Workers for this app.",
        );
        this.check(
            "runtime.cacheApi",
            resolveRule(config.runtime?.cacheApi),
            isCacheApiOperational,
            "Please use a browser that supports Cache API for this app.",
        );
        this.check(
            "runtime.webLocks",
            resolveRule(config.runtime?.webLocks),
            isWebLocksOperational,
            "Please use a browser that supports Web Locks for this app.",
        );
    }

    private check(
        id: string,
        rule: { enabled: boolean; message?: string },
        probe: () => boolean,
        fallbackMessage: string,
    ): void {
        if (!rule.enabled) {
            return;
        }

        if (probe()) {
            return;
        }

        this.failedRequirements.push({
            id,
            message: rule.message ?? fallbackMessage,
        });
    }
}

export function checkWebRequirements(config: WebRequirementsConfig): boolean {
    return new WebRequirements(config).ok;
}

export type { FailedRequirement, RequirementRule, WebRequirementsConfig } from "./config";
