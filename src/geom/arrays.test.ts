import { describe, test, expect } from "@jest/globals";

import { mapToIndex, rotateArray } from "./arrays";

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
