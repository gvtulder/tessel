/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { ColorPattern, Shape } from "./Shape";
import { DEG2RAD, dist, P, roundPoints } from "../geom/math";
import { rotateArray } from "../geom/arrays";

describe("Shape", () => {
    // TODO test circle radius

    test("can be created", () => {
        const name = "test";
        const angles = [60, 60, 60];
        const shape = new Shape(name, angles);
        expect(shape.name).toBe(name);
        expect(shape.cornerAngles).toStrictEqual(
            angles.map((a) => a * DEG2RAD),
        );
    });

    test("checks for valid inputs", () => {
        expect(() => new Shape("", [45, 45, 45])).toThrow();
        expect(() => new Shape("", [90, 90])).toThrow();
        expect(() => new Shape("", [-10, 100, 90])).toThrow();
        expect(() => new Shape("", [43, 34, 43, 35])).toThrow();
        expect(() => new Shape("", [45, 45, 90])).toThrow();
    });

    test("converts degrees to radians", () => {
        const degrees = [36, 144, 36, 144];
        const radians = degrees.map((a) => a * DEG2RAD);
        expect(new Shape("", degrees).cornerAngles).toStrictEqual(radians);
        expect(new Shape("", radians).cornerAngles).toStrictEqual(radians);
    });

    test("computes cornerTypes", () => {
        expect(new Shape("", [60, 60, 60]).cornerTypes).toStrictEqual([
            0, 0, 0,
        ]);
        expect(new Shape("", [72, 108, 72, 108]).cornerTypes).toStrictEqual([
            0, 1, 0, 1,
        ]);
    });

    test("computes rotationalSymmetries", () => {
        expect(new Shape("", [60, 60, 60]).rotationalSymmetries).toStrictEqual([
            0, 1, 2,
        ]);
        expect(new Shape("", [60, 60, 60]).uniqueRotations).toStrictEqual([0]);
        expect(
            new Shape("", [72, 108, 72, 108]).rotationalSymmetries,
        ).toStrictEqual([0, 2]);
        expect(new Shape("", [72, 108, 72, 108]).uniqueRotations).toStrictEqual(
            [0, 1],
        );
        expect(
            new Shape("", [120, 120, 120, 120, 120, 120]).rotationalSymmetries,
        ).toStrictEqual([0, 1, 2, 3, 4, 5]);
    });

    test("can be compared with equalAngles", () => {
        const s1 = new Shape("", [36, 144, 36, 144]);
        expect(s1.equalAngles(new Shape("", [60, 60, 60]))).toBe(false);
        expect(s1.equalAngles(new Shape("", [36, 144, 36, 144]))).toBe(true);
        expect(s1.equalAngles(new Shape("", [144, 36, 144, 36]))).toBe(true);
        expect(s1.equalAngles(new Shape("", [90, 90, 90, 90]))).toBe(false);
    });

    test("constructs polygons", () => {
        const angles = [60, 60, 60];
        const shape = new Shape("", angles);
        const edge = { a: P(0, 0), b: P(1, 0) };
        const expected = P([0, 0], [1, 0], [0.5, 0.87]);

        const p1 = shape.constructPolygonAB(edge.a, edge.b, 0);
        expect(roundPoints(p1.vertices, 100)).toStrictEqual(expected);
        const p2 = shape.constructPolygonEdge(edge, 0);
        expect(roundPoints(p2.vertices, 100)).toStrictEqual(expected);
        const p3 = shape.constructPolygonXYR(0, 0, 1);
        expect(roundPoints(p3.vertices, 100)).toStrictEqual(expected);

        const expectedRotated = [expected[2], expected[0], expected[1]];
        const p4 = shape.constructPolygonAB(edge.a, edge.b, 1);
        expect(roundPoints(p4.vertices, 100)).toStrictEqual(expectedRotated);
    });

    test("maps the angles to the correct vertex", () => {
        const angles = [90, 90, 150, 60, 150];
        const shape = new Shape("", angles);
        const expected = P([0, 0], [1, 0], [1, 1], [0.5, 1.87], [0, 1]);

        const p1 = shape.constructPolygonAB(expected[0], expected[1], 0);
        expect(roundPoints(p1.vertices, 100)).toStrictEqual(expected);

        const p2 = shape.constructPolygonAB(expected[1], expected[2], 1);
        expect(roundPoints(p1.vertices, 100)).toStrictEqual(expected);
    });

    test("computes coloring patterns", () => {
        const square = new Shape("square", [90, 90, 90, 90]);
        expect(square.colorPatterns).toStrictEqual([
            { numColors: 4, segmentColors: [[0, 1, 2, 3]] },
            {
                numColors: 2,
                segmentColors: [
                    [0, 0, 1, 1],
                    [0, 1, 1, 0],
                ],
            },
            { numColors: 1, segmentColors: [[0, 0, 0, 0]] },
        ] as ColorPattern[]);

        const triangle = new Shape("triangle", [60, 60, 60]);
        expect(triangle.colorPatterns).toStrictEqual([
            { numColors: 3, segmentColors: [[0, 1, 2]] },
            { numColors: 1, segmentColors: [[0, 0, 0]] },
        ] as ColorPattern[]);

        const rhombus = new Shape("rhombus", [72, 108, 72, 108]);
        expect(rhombus.colorPatterns).toStrictEqual([
            { numColors: 4, segmentColors: [[0, 1, 2, 3]] },
            { numColors: 2, segmentColors: [[0, 0, 1, 1]] },
            { numColors: 2, segmentColors: [[0, 1, 1, 0]] },
            { numColors: 1, segmentColors: [[0, 0, 0, 0]] },
        ]);

        const hexagon = new Shape("hexagon", [120, 120, 120, 120, 120, 120]);
        expect(hexagon.colorPatterns).toStrictEqual([
            { numColors: 6, segmentColors: [[0, 1, 2, 3, 4, 5]] },
            {
                numColors: 3,
                segmentColors: [
                    [0, 0, 1, 1, 2, 2],
                    [0, 1, 1, 2, 2, 0],
                ],
            },
            {
                numColors: 2,
                segmentColors: [
                    [0, 0, 0, 1, 1, 1],
                    [0, 0, 1, 1, 1, 0],
                    [0, 1, 1, 1, 0, 0],
                ],
            },
            { numColors: 1, segmentColors: [[0, 0, 0, 0, 0, 0]] },
        ]);
    });

    test("handles non-unit sides", () => {
        const angles = [120, 90, 120, 90, 120];
        // last side: 2 * sqrt(2) * cos(75deg)
        const sides = [1, 1, 1, 1, Math.sqrt(3) - 1];

        const shape = new Shape("pentagon", angles, sides);
        expect(shape.sides.map((x) => x.toFixed(4))).toStrictEqual(
            sides.map((x) => x.toFixed(4)),
        );
        expect(shape.cornerTypes).toStrictEqual([0, 1, 2, 3, 4]);

        const vertices = shape.constructPolygonXYR(0, 0, 1).vertices;
        for (let i = 0; i < angles.length; i++) {
            expect(
                dist(vertices[i], vertices[(i + 1) % angles.length]),
            ).toBeCloseTo(sides[i]);
        }

        const shape2 = new Shape(
            "pentagon2",
            rotateArray(angles, 1),
            rotateArray(sides, 1),
        );
        const vertices2 = shape2.constructPolygonXYR(0, 0, 1).vertices;
        for (let i = 0; i < angles.length; i++) {
            expect(
                dist(vertices2[i], vertices2[(i + 1) % angles.length]),
            ).toBeCloseTo(sides[(i + 1) % sides.length]);
        }
    });

    test("check Cairo pentagon", () => {
        const angles = [120, 90, 120, 90, 120];
        // last side: 2 * sqrt(2) * cos(75deg)
        const sides = [1, 1, 1, 1, Math.sqrt(3) - 1];
        const shape = new Shape("pentagon", angles, sides);
        expect(shape.rotationalSymmetries).toStrictEqual([0]);
        expect(shape.uniqueRotations).toStrictEqual([0, 1, 2, 3, 4]);
        expect(shape.cornerTypes).toStrictEqual([0, 1, 2, 3, 4]);
    });
});
