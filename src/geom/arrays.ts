/**
 * Shifts the array elements.
 * result[i + offset] = result[i]
 */

export function rotateArray<T>(arr: readonly T[], offset: number): T[] {
    const n = arr.length;
    const result = new Array<T>(n);
    for (let i = 0; i < n; i++) {
        result[i] = arr[(i + n + offset) % n];
    }
    return result;
}
/**
 * Maps array elements to indices.
 */

export function mapToIndex<T>(arr: readonly T[]): number[] {
    const map = new Map<T, number>();
    return arr.map((v) => {
        let idx = map.get(v);
        if (idx === undefined) {
            map.set(v, (idx = map.size));
        }
        return idx;
    });
}
