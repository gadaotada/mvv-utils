import type {
    CustomRequirement,
    FailedRequirement,
    RequirementResult,
    RequirementRule,
    WebRequirementsConfig,
} from "./config";
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
    private readonly requirementResults: RequirementResult[];
    private readonly readyPromise: Promise<void>;

    constructor(config: WebRequirementsConfig) {
        this.failedRequirements = [];
        this.requirementResults = [];
        this.readyPromise = this.evaluate(config);
    }

    public get ok(): boolean {
        return this.failedRequirements.length === 0;
    }

    public get failures(): FailedRequirement[] {
        return [...this.failedRequirements];
    }

    public get results(): RequirementResult[] {
        return [...this.requirementResults];
    }

    public get firstErrorMessage(): string | null {
        return this.failedRequirements[0]?.message ?? null;
    }

    public async ready(): Promise<void> {
        await this.readyPromise;
    }

    private async evaluate(config: WebRequirementsConfig): Promise<void> {
        await this.evaluateStorage(config);
        await this.evaluateCookies(config);
        await this.evaluateRuntime(config);
        await this.evaluateCustom(config);
    }

    private async evaluateStorage(config: WebRequirementsConfig): Promise<void> {
        await this.check(
            "storage.localStorage",
            resolveRule(config.storage?.localStorage),
            isLocalStorageAvailable,
            "Please enable local storage in order for this app to work.",
        );
        await this.check(
            "storage.sessionStorage",
            resolveRule(config.storage?.sessionStorage),
            isSessionStorageAvailable,
            "Please enable session storage in order for this app to work.",
        );
        await this.check(
            "storage.indexedDb",
            resolveRule(config.storage?.indexedDb),
            isIndexedDbAvailable,
            "Please enable IndexedDB in order for this app to work.",
        );
    }

    private async evaluateCookies(config: WebRequirementsConfig): Promise<void> {
        await this.check(
            "cookies.cookiesEnabled",
            resolveRule(config.cookies?.cookiesEnabled),
            areCookiesEnabled,
            "Please enable cookies in order for this app to work.",
        );
        await this.check(
            "cookies.sessionCookies",
            resolveRule(config.cookies?.sessionCookies),
            areSessionCookiesAvailable,
            "Please enable session cookies in order for this app to work.",
        );
        await this.check(
            "cookies.partitionedCookies",
            resolveRule(config.cookies?.partitionedCookies),
            arePartitionedCookiesSupported,
            "Please use a browser that supports partitioned cookies for this app.",
        );
        await this.check(
            "cookies.sameSiteNone",
            resolveRule(config.cookies?.sameSiteNone),
            isSameSiteNoneCookieSupported,
            "Please use a browser that supports SameSite=None cookies for this app.",
        );
    }

    private async evaluateRuntime(config: WebRequirementsConfig): Promise<void> {
        await this.check(
            "runtime.broadcastChannel",
            resolveRule(config.runtime?.broadcastChannel),
            isBroadcastChannelOperational,
            "Please use a browser that supports BroadcastChannel for this app.",
        );
        await this.check(
            "runtime.serviceWorker",
            resolveRule(config.runtime?.serviceWorker),
            isServiceWorkerOperational,
            "Please use a browser that supports Service Workers for this app.",
        );
        await this.check(
            "runtime.cacheApi",
            resolveRule(config.runtime?.cacheApi),
            isCacheApiOperational,
            "Please use a browser that supports Cache API for this app.",
        );
        await this.check(
            "runtime.webLocks",
            resolveRule(config.runtime?.webLocks),
            isWebLocksOperational,
            "Please use a browser that supports Web Locks for this app.",
        );
    }

    private async evaluateCustom(config: WebRequirementsConfig): Promise<void> {
        if (!config.custom) {
            return;
        }

        for (const [id, definition] of Object.entries(config.custom)) {
            await this.checkCustom(`custom.${id}`, definition);
        }
    }

    private async checkCustom(id: string, definition: CustomRequirement): Promise<void> {
        const enabled = definition.enabled ?? true;
        if (!enabled) {
            return;
        }

        let passed = false;
        try {
            passed = await definition.check();
        } catch {
            passed = false;
        }

        if (passed) {
            this.requirementResults.push({
                id,
                ok: true,
                message: "ok",
            });
            return;
        }

        const message = definition.message ?? `Custom requirement "${id}" failed.`;
        this.requirementResults.push({
            id,
            ok: false,
            message,
        });
        this.failedRequirements.push({
            id,
            message,
        });
    }

    private async check(
        id: string,
        rule: { enabled: boolean; message?: string },
        probe: () => boolean | Promise<boolean>,
        fallbackMessage: string,
    ): Promise<void> {
        if (!rule.enabled) {
            return;
        }

        let passed = false;
        try {
            passed = await probe();
        } catch {
            passed = false;
        }

        if (passed) {
            this.requirementResults.push({
                id,
                ok: true,
                message: "ok",
            });
            return;
        }

        const message = rule.message ?? fallbackMessage;
        this.requirementResults.push({
            id,
            ok: false,
            message,
        });
        this.failedRequirements.push({
            id,
            message,
        });
    }
}

export async function checkWebRequirements(config: WebRequirementsConfig): Promise<boolean> {
    const requirements = new WebRequirements(config);
    await requirements.ready();
    return requirements.ok;
}

export type {
    CustomRequirement,
    FailedRequirement,
    RequirementResult,
    RequirementRule,
    WebRequirementsConfig,
} from "./config";
