import { describe, expect, test } from "@jest/globals";
import { PRNG, RandomSampler } from "./RandomSampler";

describe("PRNG", () => {
    test("can generate random numbers", () => {
        const prng = PRNG(1234);
        for (const i of [72, 61, 9, 15, 7, 26, 50, 33]) {
            Math.floor(prng() * 100);
        }
    });

    test("can generate random numbers from a seed", () => {
        const prng = PRNG(1234);
        for (const i of [72, 61, 9, 15, 7, 26, 50, 33]) {
            expect(Math.floor(prng() * 100)).toBe(i);
        }
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
        const sampler = new RandomSampler("a", "b", "c");
        expect(sampler.size).toBe(3);
    });
});
