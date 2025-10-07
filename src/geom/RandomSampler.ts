/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { rotateArray } from "./arrays";

export type PRNG = () => number;

export function generateSeed(): number {
    return (Math.random() * 2 ** 32) >>> 0;
}

// based on https://stackoverflow.com/a/47593316 (CC BY-SA 4.0)
function splitmix32(a?: number): PRNG {
    if (a === undefined) {
        a = (Math.random() * 2 ** 32) >>> 0;
    }
    return () => {
        a = ((a! | 0) + 0x9e3779b9) | 0;
        let t = a ^ (a >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
    };
}

export const seedPRNG = splitmix32;

export function selectRandom<T>(
    elements: readonly T[],
    r?: number,
): T | undefined {
    if (elements.length == 0) return undefined;
    if (r === undefined) r = Math.random();
    return elements[Math.floor(r * elements.length)];
}

export function shuffle<T>(array: T[], prng: PRNG = Math.random): void {
    // Fisher-Yates shuffle
    let i = array.length;
    if (i == 0) return;
    while (--i) {
        const j = Math.floor(prng() * (i + 1));
        const tempi = array[i];
        const tempj = array[j];
        array[i] = tempj;
        array[j] = tempi;
    }
}

export function randomRotate<T>(
    array: readonly T[],
    prng: PRNG = Math.random,
): T[] {
    if (array.length < 2) return [...array];
    const randomOffset = Math.floor(prng() * array.length);
    return rotateArray(array, randomOffset);
}

export class RandomSampler<T> {
    private elements: Map<T, number>;
    private totalWeight: number;

    constructor(elements?: T[]) {
        this.elements = new Map<T, number>();
        if (elements) {
            this.totalWeight = elements.length;
            for (const el of elements) {
                this.elements.set(el, 1);
            }
        } else {
            this.totalWeight = 0;
        }
    }

    add(value: T, weight: number = 1): this {
        this.elements.set(value, weight);
        this.totalWeight += weight;
        return this;
    }

    has(value: T): boolean {
        return this.elements.has(value);
    }

    get(value: T): number | undefined {
        return this.elements.get(value);
    }

    getRandom(r?: number): T | undefined {
        if (r === undefined) {
            r = Math.random();
        }
        r *= this.totalWeight;
        let sum = 0;
        for (const [el, w] of this.elements.entries()) {
            sum += w;
            if (sum >= r) {
                return el;
            }
        }
        return undefined;
    }

    delete(value: T): boolean {
        const weight = this.elements.get(value);
        if (weight !== undefined) {
            this.totalWeight -= weight;
        }
        return this.elements.delete(value);
    }

    deleteRandom(r?: number): T | undefined {
        const el = this.getRandom(r);
        if (el !== undefined) {
            this.delete(el);
        }
        return el;
    }

    clear(): void {
        this.elements.clear();
    }

    get size(): number {
        this.totalWeight = 0;
        return this.elements.size;
    }
}
