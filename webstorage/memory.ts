export class MemoryStorage implements Storage {
    private readonly store = new Map<string, string>();

    public get length(): number {
        return this.store.size;
    }

    public getItem(key: string): string | null {
        return this.store.get(key) ?? null;
    }

    public setItem(key: string, value: string): void {
        this.store.set(key, value);
    }

    public removeItem(key: string): void {
        this.store.delete(key);
    }

    public key(index: number): string | null {
        if (index < 0 || index >= this.store.size) {
            return null;
        }

        let i = 0;
        for (const key of this.store.keys()) {
            if (i === index) {
                return key;
            }
            i += 1;
        }

        return null;
    }


    public clear(): void {
        this.store.clear();
    }
}
