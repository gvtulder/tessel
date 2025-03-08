import { describe, test, expect } from "@jest/globals";

import {
    DEG2RAD,
    P,
    Point,
    angleDist,
    area,
    bbox,
    centroid,
    comparePoint,
    dist,
    distToLine,
    distToLineSegment,
    edgeToAngle,
    mapToIndex,
    mergeBBox,
    mergeBBoxItems,
    midpoint,
    orientedArea,
    rotateArray,
    weightedSumPoint,
} from "./math";

describe("P", () => {
    test.each([
        [{ x: 0, y: 1 }, 0, 1],
        [[{ x: 0, y: 1 }], [0, 1]],
        [
            [
                { x: 0, y: 1 },
                { x: 2, y: 3 },
            ],
            [0, 1],
            [2, 3],
        ],
    ])("creates points from shorthand", (output, ...input) => {
        expect(P(...(input as [number, number]))).toStrictEqual(output);
    });
});

describe("dist", () => {
    test("computes distances", () => {
        const a = P(12, 3);
        const b = P(8, -5);
        expect(dist(a, b)).toBeCloseTo(
            Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
        );
    });
});

describe("distToLine", () => {
    test.each([
        [P(0, 0), P(1, 0), P(0.5, 1), 1],
        [P(0, 0), P(1, 0), P(0, 1), 1],
        [P(0, 0), P(1, 0), P(1, 1), 1],
        [P(0, 0), P(1, 0), P(0, 0), 0],
        [P(0, 0), P(1, 0), P(2, 0), 0],
    ])("computes distances to line", (a, b, p, expected) => {
        expect(distToLine(a, b, p)).toBeCloseTo(expected);
    });
});

describe("distToLineSegment", () => {
    test.each([
        [P(0, 0), P(1, 0), P(0.5, 1), 1],
        [P(0, 0), P(1, 0), P(0, 1), 1],
        [P(0, 0), P(1, 0), P(1, 1), 1],
        [P(0, 0), P(1, 0), P(-1, 0), 1],
        [P(0, 0), P(1, 0), P(2, 0), 1],
        [P(0, 0), P(0, 0), P(2, 0), 2],
    ])("computes distances to line segment", (a, b, p, expected) => {
        expect(distToLineSegment(a, b, p)).toBeCloseTo(expected);
    });
});

describe("comparePoint", () => {
    test("compares points", () => {
        expect(comparePoint(P(0, 3), P(1, 3))).toBe(-1);
        expect(comparePoint(P(0, 3), P(1, 3))).toBe(-1);
        expect(comparePoint(P(3, 3), P(1, 3))).toBe(1);
        expect(comparePoint(P(3, 3), P(3, 5))).toBe(-1);
        expect(comparePoint(P(3, 3), P(3, 1))).toBe(1);
        expect(comparePoint(P(3, 3), P(3, 3))).toBe(0);
    });
});

describe("edgeToAngle", () => {
    test("computes angles", () => {
        const edge = { a: P(2, 1), b: P(3, 2) };
        expect(edgeToAngle(edge)).toBe(45 * DEG2RAD);
    });
});

describe("angleDist", () => {
    test.each([
        [30, 60, 30],
        [-30, 60, 90],
        [10, 350, 20],
        [350, 10, 20],
        [160, 180, 20],
        [-180, 180, 0],
    ])("computes angle distances", (a, b, d) => {
        expect(angleDist(a * DEG2RAD, b * DEG2RAD)).toBeCloseTo(d * DEG2RAD);
    });
});

describe("midpoint", () => {
    test("computes midpoints", () => {
        const a = P(12, 3);
        const b = P(8, -5);
        expect(midpoint(a, b)).toStrictEqual({
            x: 10,
            y: -1,
        });
    });
});

describe("weightedSumPoint", () => {
    test("computes the weighted sum of two points", () => {
        const a = P(12, 3);
        const b = P(8, -5);
        expect(weightedSumPoint(a, b)).toStrictEqual({
            x: (12 + 8) / 2,
            y: (3 - 5) / 2,
        });
        expect(weightedSumPoint(a, b, 1, 0)).toStrictEqual(a);
        expect(weightedSumPoint(a, b, 0, 1)).toStrictEqual(b);
        expect(weightedSumPoint(a, b, 1, 2, 3)).toStrictEqual({
            x: (12 + 8 * 2) / 3,
            y: (3 - 5 * 2) / 3,
        });
        expect(weightedSumPoint(a, b, 1, 2)).toStrictEqual({
            x: (12 + 8 * 2) / 3,
            y: (3 - 5 * 2) / 3,
        });
    });
});

describe("centroid", () => {
    test("computes centroids", () => {
        const points = [P(4, 1), P(3, 3), P(-2, 7)];
        expect(centroid(points)).toStrictEqual({
            x: (4 + 3 - 2) / 3,
            y: (1 + 3 + 7) / 3,
        });
    });

    const shapes = [
        [P([0, 0], [1, 0], [1, 1], [0, 1]), P(0.5, 0.5)],
        [P([0, 0], [0, 1], [1, 1], [1, 0]), P(0.5, 0.5)],
        [P([3, 1], [7, 2], [4, 4], [8, 6], [1, 7]), P(3.935, 4.2846)],
        [P([1, 7], [8, 6], [4, 4], [7, 2], [3, 1]), P(3.935, 4.2846)],
        [P([8, 6], [4, 4], [7, 2]), P(6.333, 4)],
        [P([8, 6], [4, 4], [7, 2]), P(6.333, 4)],
    ] as [Point[], Point][];
    test.each(shapes)(
        "computes complex centroids",
        (points: Point[], expected: Point) => {
            const c = centroid(points);
            expect(c.x).toBeCloseTo(expected.x);
            expect(c.y).toBeCloseTo(expected.y);
        },
    );
});

describe("area and orientedArea", () => {
    const shapes = [
        [P([0, 0], [1, 0], [1, 1], [0, 1]), 1],
        [P([0, 0], [0, 1], [1, 1], [1, 0]), -1],
        [P([3, 1], [7, 2], [4, 4], [8, 6], [1, 7]), 20.5],
        [P([8, 6], [4, 4], [7, 2]), 7],
        [P([7, 2], [4, 4], [8, 6]), -7],
    ] as [Point[], number][];
    test.each(shapes)(
        "computes oriented areas",
        (points: Point[], expected: number) => {
            expect(orientedArea(points)).toBeCloseTo(expected);
        },
    );
    test.each(shapes)("computes areas", (points: Point[], expected: number) => {
        expect(area(points)).toBeCloseTo(Math.abs(expected));
    });
});

describe("bbox", () => {
    test.each([P([4, 1], [3, 3], [-2, 7]), P([-3, 2], [3, 3], [5, 7])])(
        "computes a bounding box",
        (...points: Point[]) => {
            expect(bbox(points)).toStrictEqual({
                minX: Math.min(...points.map((p) => p.x)),
                minY: Math.min(...points.map((p) => p.y)),
                maxX: Math.max(...points.map((p) => p.x)),
                maxY: Math.max(...points.map((p) => p.y)),
            });
        },
    );
});

describe("mergeBBox", () => {
    test("merges bounding boxes", () => {
        const a = {
            minX: 3,
            minY: 2,
            maxX: 6,
            maxY: 7,
        };
        const b = {
            minX: -3,
            minY: -2,
            maxX: -6,
            maxY: -7,
        };
        const combined = {
            minX: -3,
            minY: -2,
            maxX: 6,
            maxY: 7,
        };
        expect(mergeBBox(a, b)).toStrictEqual(combined);
        expect(mergeBBox(b, a)).toStrictEqual(combined);
        expect(mergeBBox(a, combined)).toStrictEqual(combined);
        expect(mergeBBox(a, null)).toStrictEqual(a);
        expect(mergeBBox(null, b)).toStrictEqual(b);
    });
});

describe("mergeBBoxItems", () => {
    test("merges bounding boxes for multiple items", () => {
        const a = {
            bbox: {
                minX: 3,
                minY: 2,
                maxX: 6,
                maxY: 7,
            },
        };
        const b = {
            bbox: {
                minX: -3,
                minY: -2,
                maxX: -6,
                maxY: -7,
            },
        };
        const combined = {
            bbox: {
                minX: -3,
                minY: -2,
                maxX: 6,
                maxY: 7,
            },
        };
        expect(mergeBBoxItems([a, b])).toStrictEqual(combined.bbox);
        expect(mergeBBoxItems([b, a])).toStrictEqual(combined.bbox);
        expect(mergeBBoxItems([a, combined])).toStrictEqual(combined.bbox);
        expect(mergeBBoxItems([a])).toStrictEqual(a.bbox);
        expect(mergeBBoxItems([])).toBeUndefined();
    });
});

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
