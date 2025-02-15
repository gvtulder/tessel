import { describe, test, expect } from "@jest/globals";

import {
    DEG2RAD,
    bbox,
    centroid,
    comparePoint,
    dist,
    edgeToAngle,
    midpoint,
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
        const edge = { a: a, b: b };
        expect(midpoint(edge)).toStrictEqual({
            x: 10,
            y: -1,
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
});

describe("bbox", () => {
    test("computes a bounding box", () => {
        const points = [
            { x: 4, y: 1 },
            { x: 3, y: 3 },
            { x: -2, y: 7 },
        ];
        expect(bbox(points)).toStrictEqual({
            minX: Math.min(...points.map((p) => p.x)),
            minY: Math.min(...points.map((p) => p.y)),
            maxX: Math.max(...points.map((p) => p.x)),
            maxY: Math.max(...points.map((p) => p.y)),
        });
    });
});
