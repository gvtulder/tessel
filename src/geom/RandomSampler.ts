/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { rotateArray } from "./arrays";

/**
 * A random number generator.
 */
export type PRNG = () => number;

/**
 * Generates a random seed value.
 * @returns a random seed value
 */
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

/**
 * A 32-bit random number generator.
 */
export const seedPRNG = splitmix32;

/**
 * Selects a random element from an array.
 * @param elements an array of elements
 * @param r an optional predefined random number for deterministic output
 * @returns an element from elements, or undefined if elements is empty
 */
export function selectRandom<T>(
    elements: readonly T[],
    r?: number,
): T | undefined {
    if (elements.length == 0) return undefined;
    if (r === undefined) r = Math.random();
    return elements[Math.floor(r * elements.length)];
}

/**
 * Shuffles an array in-place.
 * @param array an array
 * @param prng an optional random-number source
 */
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

/**
 * Returns a copy of the array rotated by a random number of steps.
 * (See the rotateArray function.)
 * @param array an array
 * @param prng an optional random-number source
 * @returns a copy of the array, rotated with a random offset
 */
export function randomRotate<T>(
    array: readonly T[],
    prng: PRNG = Math.random,
): T[] {
    if (array.length < 2) return [...array];
    const randomOffset = Math.floor(prng() * array.length);
    return rotateArray(array, randomOffset);
}

/**
 * A set for weighted random sampling that can add and remove items.
 * The probability for element i is weights[i] / sum(weights).
 */
export class RandomSampler<T> {
    private elements: Map<T, number>;
    private totalWeight: number;

    /**
     * Initializes a new collection.
     * @param elements the list of initial item to be added with weight 1
     */
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

    /**
     * Adds an item to the set, or updates the weight if the
     * item is already included of the set.
     * @param value the item to add
     * @param weight the optional weight > 0 (default: 1)
     * @returns the set object
     */
    add(value: T, weight: number = 1): this {
        this.elements.set(value, weight);
        this.totalWeight += weight;
        return this;
    }

    /**
     * Checks if the item appears in the set.
     * @param value the item
     * @returns true if the set includes the item
     */
    has(value: T): boolean {
        return this.elements.has(value);
    }

    /**
     * Get the weight of an item.
     * @param value the item
     * @returns the weight, or undefined if the set does not include the item
     */
    get(value: T): number | undefined {
        return this.elements.get(value);
    }

    /**
     * Get a random item from the set, based on weighted sampling.
     * @param r optional: a random number for deterministic output
     * @returns a random item, or undefined if the set is empty
     */
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

    /**
     * Removes an item from the set, if it exists.
     * @param value the item to be removed
     * @returns true if the item was removed from the set
     */
    delete(value: T): boolean {
        const weight = this.elements.get(value);
        if (weight !== undefined) {
            this.totalWeight -= weight;
        }
        return this.elements.delete(value);
    }

    /**
     * Removes a random item from the set.
     * @param r optional: a random number for deterministic output
     * @returns the removed item, or undefined if the set was empty
     */
    deleteRandom(r?: number): T | undefined {
        const el = this.getRandom(r);
        if (el !== undefined) {
            this.delete(el);
        }
        return el;
    }

    /**
     * Removes all items from the set.
     */
    clear(): void {
        this.elements.clear();
    }

    /**
     * The number of elements in the set.
     */
    get size(): number {
        this.totalWeight = 0;
        return this.elements.size;
    }
}
