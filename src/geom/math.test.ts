import { describe, test, expect } from "@jest/globals";

import {
    DEG2RAD,
    Point,
    area,
    bbox,
    centroid,
    comparePoint,
    dist,
    edgeToAngle,
    mergeBBox,
    midpoint,
    orientedArea as orientedArea,
    weightedSumPoint,
} from "./math";

describe("dist", () => {
    test("computes distances", () => {
        const a = { x: 12, y: 3 };
        const b = { x: 8, y: -5 };
        expect(dist(a, b)).toBeCloseTo(
            Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
        );
    });
});

describe("comparePoint", () => {
    test("compares points", () => {
        expect(comparePoint({ x: 0, y: 3 }, { x: 1, y: 3 })).toBe(-1);
        expect(comparePoint({ x: 3, y: 3 }, { x: 1, y: 3 })).toBe(1);
        expect(comparePoint({ x: 3, y: 3 }, { x: 3, y: 5 })).toBe(-1);
        expect(comparePoint({ x: 3, y: 3 }, { x: 3, y: 1 })).toBe(1);
        expect(comparePoint({ x: 3, y: 3 }, { x: 3, y: 3 })).toBe(0);
    });
});

describe("edgeToAngle", () => {
    test("computes angles", () => {
        const edge = { a: { x: 2, y: 1 }, b: { x: 3, y: 2 } };
        expect(edgeToAngle(edge)).toBe(45 * DEG2RAD);
    });
});

describe("midpoint", () => {
    test("computes midpoints", () => {
        const a = { x: 12, y: 3 };
        const b = { x: 8, y: -5 };
        expect(midpoint(a, b)).toStrictEqual({
            x: 10,
            y: -1,
        });
    });
});

describe("weightedSumPoint", () => {
    test("computes the weighted sum of two points", () => {
        const a = { x: 12, y: 3 };
        const b = { x: 8, y: -5 };
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
    });
});

describe("centroid", () => {
    test("computes centroids", () => {
        const points = [
            { x: 4, y: 1 },
            { x: 3, y: 3 },
            { x: -2, y: 7 },
        ];
        expect(centroid(points)).toStrictEqual({
            x: (4 + 3 - 2) / 3,
            y: (1 + 3 + 7) / 3,
        });
    });

    const shapes = [
        [
            [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 0, y: 1 },
            ],
            { x: 0.5, y: 0.5 },
        ],

        [
            [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 1 },
                { x: 1, y: 0 },
            ],
            { x: 0.5, y: 0.5 },
        ],
        [
            [
                { x: 3, y: 1 },
                { x: 7, y: 2 },
                { x: 4, y: 4 },
                { x: 8, y: 6 },
                { x: 1, y: 7 },
            ],
            { x: 3.935, y: 4.2846 },
        ],
        [
            [
                { x: 1, y: 7 },
                { x: 8, y: 6 },
                { x: 4, y: 4 },
                { x: 7, y: 2 },
                { x: 3, y: 1 },
            ],
            { x: 3.935, y: 4.2846 },
        ],
        [
            [
                { x: 8, y: 6 },
                { x: 4, y: 4 },
                { x: 7, y: 2 },
            ],
            { x: 6.333, y: 4 },
        ],
        [
            [
                { x: 8, y: 6 },
                { x: 4, y: 4 },
                { x: 7, y: 2 },
            ],
            { x: 6.333, y: 4 },
        ],
    ];
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
        [
            [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 0, y: 1 },
            ],
            1,
        ],

        [
            [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 1 },
                { x: 1, y: 0 },
            ],
            -1,
        ],
        [
            [
                { x: 3, y: 1 },
                { x: 7, y: 2 },
                { x: 4, y: 4 },
                { x: 8, y: 6 },
                { x: 1, y: 7 },
            ],
            20.5,
        ],
        [
            [
                { x: 8, y: 6 },
                { x: 4, y: 4 },
                { x: 7, y: 2 },
            ],
            7,
        ],
        [
            [
                { x: 7, y: 2 },
                { x: 4, y: 4 },
                { x: 8, y: 6 },
            ],
            -7,
        ],
    ];
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
    test.each([
        [
            { x: 4, y: 1 },
            { x: 3, y: 3 },
            { x: -2, y: 7 },
        ],
        [
            { x: -3, y: 2 },
            { x: 3, y: 3 },
            { x: 5, y: 7 },
        ],
    ])("computes a bounding box", (...points: Point[]) => {
        expect(bbox(points)).toStrictEqual({
            minX: Math.min(...points.map((p) => p.x)),
            minY: Math.min(...points.map((p) => p.y)),
            maxX: Math.max(...points.map((p) => p.x)),
            maxY: Math.max(...points.map((p) => p.y)),
        });
    });
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
    });
});
