/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

/**
 * Set-like object that looks inside arrays for equality.
 */
export class ArraySet<T> {
    private elements: T[][];

    constructor(...values: T[][]) {
        this.elements = [];
        for (const v of values) {
            this.add(v);
        }
    }

    get size(): number {
        return this.elements.length;
    }

    add(value: T[]): this {
        if (this.indexOf(value) === -1) {
            this.elements.push(value);
        }
        return this;
    }

    has(value: readonly T[]): boolean {
        return this.indexOf(value) !== -1;
    }

    delete(value: readonly T[]): this {
        const index = this.indexOf(value);
        if (index !== -1) {
            this.elements.splice(index, 1);
        }
        return this;
    }

    values(): ArrayIterator<T[]> {
        return this.elements.values();
    }

    private indexOf(value: readonly T[]): number {
        const elements = this.elements;
        for (let idx = 0; idx < elements.length; idx++) {
            const el = elements[idx];
            if (value.length === el.length) {
                let match = true;
                for (let i = 0; match && i < el.length; i++) {
                    if (value[i] != el[i]) match = false;
                }
                if (match) return idx;
            }
        }
        return -1;
    }
}
