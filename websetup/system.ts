export type BrowserName =
    | "chrome"
    | "safari"
    | "firefox"
    | "edge"
    | "opera"
    | "ie"
    | "unknown";

export type OsName =
    | "windows"
    | "macos"
    | "ios"
    | "android"
    | "linux"
    | "unknown";

export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export type BrowserInfo = {
    name: BrowserName;
    version: string | null;
    userAgent: string;
    language: string | null;
    languages: readonly string[];
};

export type OsInfo = {
    name: OsName;
    platform: string | null;
};

export type DeviceInfo = {
    type: DeviceType;
    touchPoints: number | null;
};

export type RuntimeInfo = {
    isSecureContext: boolean;
    hardwareConcurrency: number | null;
    deviceMemoryGb: number | null;
    timezone: string | null;
};

export type SystemInfo = {
    browser: BrowserInfo;
    os: OsInfo;
    device: DeviceInfo;
    runtime: RuntimeInfo;
};

export function getSystemInfo(): SystemInfo {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const ua = nav?.userAgent ?? "";
    const platform = nav?.platform ?? null;

    return {
        browser: {
            name: detectBrowserName(ua),
            version: detectBrowserVersion(ua),
            userAgent: ua,
            language: nav?.language ?? null,
            languages: Object.freeze([...(nav?.languages ?? [])]),
        },
        os: {
            name: detectOsName(ua, platform),
            platform,
        },
        device: {
            type: detectDeviceType(ua),
            touchPoints: typeof nav?.maxTouchPoints === "number" ? nav.maxTouchPoints : null,
        },
        runtime: {
            isSecureContext: typeof globalThis.isSecureContext === "boolean" ? globalThis.isSecureContext : false,
            hardwareConcurrency:
                typeof nav?.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
            deviceMemoryGb: getDeviceMemory(nav),
            timezone: getTimezone(),
        },
    };
}

function detectBrowserName(ua: string): BrowserName {
    if (/Edg\//i.test(ua)) return "edge";
    if (/OPR\//i.test(ua)) return "opera";
    if (/Firefox\//i.test(ua)) return "firefox";
    if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return "chrome";
    if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "safari";
    if (/MSIE|Trident/i.test(ua)) return "ie";
    return "unknown";
}

function detectBrowserVersion(ua: string): string | null {
    const patterns = [/Edg\/([\d.]+)/i, /OPR\/([\d.]+)/i, /Firefox\/([\d.]+)/i, /Chrome\/([\d.]+)/i, /Version\/([\d.]+).*Safari/i, /(?:MSIE |rv:)([\d.]+)/i];
    for (const pattern of patterns) {
        const match = ua.match(pattern);
        if (match?.[1]) return match[1];
    }
    return null;
}

function detectOsName(ua: string, platform: string | null): OsName {
    const p = (platform ?? "").toLowerCase();
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    if (p.includes("win")) return "windows";
    if (p.includes("mac")) return "macos";
    if (p.includes("linux")) return "linux";
    return "unknown";
}

function detectDeviceType(ua: string): DeviceType {
    if (/ipad|tablet/i.test(ua)) return "tablet";
    if (/mobi|iphone|android/i.test(ua)) return "mobile";
    if (!ua) return "unknown";
    return "desktop";
}

function getDeviceMemory(nav: Navigator | null): number | null {
    if (!nav) return null;
    const candidate = nav as Navigator & { deviceMemory?: number };
    return typeof candidate.deviceMemory === "number" ? candidate.deviceMemory : null;
}

function getTimezone(): string | null {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
    } catch {
        return null;
    }
}
