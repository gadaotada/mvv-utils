export const CONNECTION_STATUS = { online: "online", offline: "offline" } as const;
export type ConnectivityStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];
export type ConnectivityListener = (status: ConnectivityStatus, isOnline: boolean) => void;

export class OfflineTracker {
    private readonly listeners = new Set<ConnectivityListener>();
    private subscribed = false;
    private currentStatus: ConnectivityStatus;
    private readonly onOnline = (): void => this.updateStatus(CONNECTION_STATUS.online);
    private readonly onOffline = (): void => this.updateStatus(CONNECTION_STATUS.offline);

    constructor() {
        this.currentStatus = this.detectInitialStatus();
    }

    public get status(): ConnectivityStatus {
        return this.currentStatus;
    }

    public get isOnline(): boolean {
        return this.currentStatus === CONNECTION_STATUS.online;
    }

    public start(): void {
        if (this.subscribed || typeof window === "undefined") {
            return;
        }

        window.addEventListener(CONNECTION_STATUS.online, this.onOnline);
        window.addEventListener(CONNECTION_STATUS.offline, this.onOffline);
        this.subscribed = true;
    }

    public stop(): void {
        if (!this.subscribed || typeof window === "undefined") {
            return;
        }

        window.removeEventListener(CONNECTION_STATUS.online, this.onOnline);
        window.removeEventListener(CONNECTION_STATUS.offline, this.onOffline);
        this.subscribed = false;
    }

    public subscribe(listener: ConnectivityListener): () => void {
        this.listeners.add(listener);
        listener(this.currentStatus, this.isOnline);
        this.start();

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.stop();
            }
        };
    }

    private updateStatus(status: ConnectivityStatus): void {
        if (status === this.currentStatus) {
            return;
        }

        this.currentStatus = status;
        for (const listener of this.listeners) {
            listener(this.currentStatus, this.isOnline);
        }
    }

    private detectInitialStatus(): ConnectivityStatus {
        if (typeof navigator === "undefined") {
            return CONNECTION_STATUS.online;
        }
        return navigator.onLine ? CONNECTION_STATUS.online : CONNECTION_STATUS.offline;
    }
}
