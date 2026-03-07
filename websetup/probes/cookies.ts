function getCookie(name: string): string | null {
    const prefix = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie.split("; ").find((part) => part.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function setCookie(raw: string): void {
    document.cookie = raw;
}

function deleteCookie(name: string): void {
    setCookie(`${encodeURIComponent(name)}=; Max-Age=0; path=/`);
}

function canUseCookie(rawCookie: string, name: string, expected = "1"): boolean {
    try {
        setCookie(rawCookie);
        return getCookie(name) === expected;
    } catch {
        return false;
    } finally {
        try {
            deleteCookie(name);
        } catch {
            // ignore cleanup errors
        }
    }
}

export function areCookiesEnabled(): boolean {
    if (typeof document === "undefined") return false;
    const key = `websetup_cookie_${Date.now()}`;
    return canUseCookie(`${encodeURIComponent(key)}=1; path=/`, key);
}

export function areSessionCookiesAvailable(): boolean {
    if (typeof document === "undefined") return false;
    const key = `websetup_session_cookie_${Date.now()}`;
    return canUseCookie(`${encodeURIComponent(key)}=1; path=/`, key);
}

export function arePartitionedCookiesSupported(): boolean {
    if (typeof document === "undefined") return false;
    const key = `websetup_partitioned_cookie_${Date.now()}`;
    return canUseCookie(
        `${encodeURIComponent(key)}=1; path=/; Secure; SameSite=None; Partitioned`,
        key,
    );
}

export function isSameSiteNoneCookieSupported(): boolean {
    if (typeof document === "undefined") return false;
    const key = `websetup_samesite_none_cookie_${Date.now()}`;
    return canUseCookie(`${encodeURIComponent(key)}=1; path=/; Secure; SameSite=None`, key);
}
