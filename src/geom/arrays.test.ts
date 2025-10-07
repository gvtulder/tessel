/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test, expect } from "@jest/globals";

import { mapToIndex, rotateArray, UniqueNumberCycleSet } from "./arrays";

describe("rotateArray", () => {
    test.each([
        [[0, 1, 2, 3], 0, [0, 1, 2, 3]],
        [[0, 1, 2, 3], 1, [1, 2, 3, 0]],
        [[0, 1, 2, 3], 2, [2, 3, 0, 1]],
        [[0, 1, 2, 3], 3, [3, 0, 1, 2]],
        [[0, 1, 2, 3], -3, [1, 2, 3, 0]],
        [[0, 1, 2, 3], -2, [2, 3, 0, 1]],
        [[0, 1, 2, 3], -1, [3, 0, 1, 2]],
        [[], 0, []],
    ] as [number[], number, number[]][])(
        "rotates arrays",
        (input: number[], offset: number, output: number[]) => {
            expect(rotateArray(input, offset)).toStrictEqual(output);
        },
    );
});

describe("mapToIndex", () => {
    test.each([
        [
            [0, 1, 2, 3],
            [0, 1, 2, 3],
        ],
        [
            [1, 2, 3, 0],
            [0, 1, 2, 3],
        ],
        [[], []],
        [
            [0, 0, 1, 1],
            [0, 0, 1, 1],
        ],
        [
            [3, 2, 3, 1],
            [0, 1, 0, 2],
        ],
    ])("maps to indices", (arr, expected) => {
        expect(mapToIndex(arr)).toStrictEqual(expected);
    });
});

describe("UniqueNumberCycleSet", () => {
    test("maintains a set of unique arrays", () => {
        const set = new UniqueNumberCycleSet();
        set.add([0, 1, 2]);
        set.add([1, 2, 0]);
        expect(set.size).toBe(1);
        set.add([4, 2, 1, 3]);
        expect(set.size).toBe(2);
        set.add([]);
        expect(set.size).toBe(3);
        expect([...set.values()]).toStrictEqual([[0, 1, 2], [4, 2, 1, 3], []]);
    });
});
