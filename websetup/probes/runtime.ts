export function isBroadcastChannelOperational(): boolean {
    try {
        const name = `websetup_bc_${Date.now()}`;
        const bc = new BroadcastChannel(name);
        bc.close();
        return true;
    } catch {
        return false;
    }
}

export function isServiceWorkerOperational(): boolean {
    return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

export function isCacheApiOperational(): boolean {
    return typeof caches !== "undefined";
}

export function isWebLocksOperational(): boolean {
    return typeof navigator !== "undefined" && "locks" in navigator;
}
