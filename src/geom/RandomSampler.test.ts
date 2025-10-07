/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import {
    seedPRNG,
    RandomSampler,
    generateSeed,
    selectRandom,
    shuffle,
    randomRotate,
} from "./RandomSampler";

describe("generateSeed", () => {
    test("can generate seeds", () => {
        const a = generateSeed();
        const b = generateSeed();
        expect(a).not.toBeCloseTo(b, 5);
    });
});

describe("PRNG", () => {
    test("can generate random numbers", () => {
        const prng = seedPRNG();
        const a = prng();
        const b = prng();
        expect(a).not.toBeCloseTo(b);
    });

    test("can generate random numbers from a seed", () => {
        const prng = seedPRNG(1234);
        for (const i of [72, 61, 9, 15, 7, 26, 50, 33]) {
            expect(Math.floor(prng() * 100)).toBe(i);
        }
    });
});

describe("selectRandom", () => {
    test("can select random items from a list", () => {
        const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        expect(selectRandom(array, 0.0)).toBe(0);
        expect(selectRandom(array, 0.49)).toBe(4);
        expect(selectRandom(array, 0.99)).toBe(9);

        selectRandom(array);
        selectRandom(array);

        expect(selectRandom([])).toBeUndefined();
        expect(selectRandom([], 0.1)).toBeUndefined();
        expect(selectRandom([1], 0.0)).toBe(1);
        expect(selectRandom([1], 0.99)).toBe(1);
    });
});

describe("shuffle", () => {
    test("can shuffle elements", () => {
        const prng = seedPRNG(1234);
        const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffle(array, prng);
        expect(array).toStrictEqual([8, 3, 4, 2, 6, 9, 1, 0, 5, 7]);
        shuffle(array);

        const empty: number[] = [];
        shuffle(empty);
        expect(empty).toStrictEqual([]);

        const one = [1];
        shuffle(one);
        expect(one).toStrictEqual([1]);
    });
});

describe("randomRotate", () => {
    test("can random-rotate arrays", () => {
        const prng = seedPRNG(1234);
        const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        expect(randomRotate(array, prng)).toStrictEqual([
            7, 8, 9, 0, 1, 2, 3, 4, 5, 6,
        ]);
        expect(randomRotate(array, prng).length).toBe(10);

        const empty: number[] = [];
        expect(randomRotate(empty)).toStrictEqual([]);

        const one = [1];
        expect(randomRotate(one)).toStrictEqual([1]);
    });
});

describe("RandomSampler", () => {
    test("can add samples", () => {
        const sampler = new RandomSampler();
        expect(sampler.size).toBe(0);
        expect(sampler.add("a", 1)).toBe(sampler);
        expect(sampler.get("a")).toBe(1);
        expect(sampler.size).toBe(1);
        sampler.add("a", 2);
        expect(sampler.get("a")).toBe(2);
        expect(sampler.has("a")).toBe(true);
        expect(sampler.has("b")).toBe(false);
        expect(sampler.size).toBe(1);
        sampler.add("b", 3);
        expect(sampler.size).toBe(2);
        expect(sampler.delete("b")).toBe(true);
        expect(sampler.delete("b")).toBe(false);
        expect(sampler.size).toBe(1);
        sampler.clear();
        expect(sampler.size).toBe(0);
    });

    test("can select random samples", () => {
        const sampler = new RandomSampler();
        sampler.add("a", 1);
        sampler.add("b", 2);
        sampler.add("c", 3);
        expect(sampler.getRandom(0.5 / 6)).toBe("a");
        expect(sampler.getRandom(2.0 / 6)).toBe("b");
        expect(sampler.getRandom(5.0 / 6)).toBe("c");
        expect(sampler.getRandom(15.0 / 6)).toBeUndefined();
        sampler.delete("b");
        expect(sampler.getRandom(0.5 / 4)).toBe("a");
        expect(sampler.getRandom(1.1 / 4)).toBe("c");
    });

    test("can delete random samples", () => {
        const sampler = new RandomSampler();
        sampler.add("a", 1);
        sampler.add("b", 2);
        sampler.add("c", 3);
        expect(sampler.deleteRandom(2.0 / 6)).toBe("b");
        expect(sampler.deleteRandom(1.1 / 4)).toBe("c");
        expect(sampler.deleteRandom()).toBe("a");
        expect(sampler.deleteRandom()).toBeUndefined();
    });

    test("can be initialized with elements", () => {
        const sampler = new RandomSampler(["a", "b", "c"]);
        expect(sampler.size).toBe(3);
    });
});
