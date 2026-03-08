export function getPosition(state: unknown): {x: number, y: number} | null {
    if (!state) return null;

    if (typeof state === "object" && "x" in state && "y" in state ) {
        const checkedX = typeof state.x === "number" ? state.x : null;
        const checkedY = typeof state.y === "number" ? state.y : null;
        const check = checkedX !== null && checkedY !== null;

        return (check ? { x: checkedX, y: checkedY} : null);
    }

    return null
}

export function fastArrayGenerator<T>(length: number, factory: (index: number) => T): T[] {
    const safeLength = Math.max(0, Math.floor(length));
    const result: T[] = new Array(safeLength);

    for (let index = 0; index < safeLength; index++) {
        result[index] = factory(index);
    }

    return result;
}