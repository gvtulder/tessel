/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

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

/**
 * A set (map) of cycle-unique arrays.
 * If [0, 1, 2] is in the set, [1, 2, 0] will not be added.
 */
export class UniqueNumberCycleSet {
    private elements: Map<string, number[]>;

    constructor() {
        this.elements = new Map<string, number[]>();
    }

    add(seq: number[]): this {
        let key: string;
        for (let r = 0; r < seq.length; r++) {
            seq.push(seq.shift() as number);
            key = seq.join("-");
            if (this.elements.has(key)) return this;
        }
        this.elements.set(key!, seq);
        return this;
    }

    values(): IteratorObject<number[]> {
        return this.elements.values();
    }

    get size(): number {
        return this.elements.size;
    }
}
