import { describe, expect, test } from "@jest/globals";
import { Shape } from "./Shape";
import { DEG2RAD, Point } from "./math";

function roundPoints(
    points: readonly Point[],
    precision: number,
): readonly Point[] {
    return points.map((p) => ({
        x: Math.round(100 * p.x) / precision,
        y: Math.round(100 * p.y) / precision,
    }));
}

describe("Shape", () => {
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
        expect(() => new Shape("", [45, 45, 45])).toThrowError();
        expect(() => new Shape("", [90, 90])).toThrowError();
        expect(() => new Shape("", [-10, 100, 90])).toThrowError();
        expect(() => new Shape("", [43, 34, 43, 35])).toThrowError();
        expect(() => new Shape("", [45, 45, 90])).toThrowError();
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
        expect(
            new Shape("", [72, 108, 72, 108]).rotationalSymmetries,
        ).toStrictEqual([0, 2]);
    });

    test("constructs polygons", () => {
        const angles = [60, 60, 60];
        const shape = new Shape("", angles);
        const edge = { a: { x: 0, y: 0 }, b: { x: 1, y: 0 } };
        const expected = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0.5, y: 0.87 },
        ];

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
        const expected = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0.5, y: 1.87 },
            { x: 0, y: 1 },
        ];

        const p1 = shape.constructPolygonAB(expected[0], expected[1], 0);
        expect(roundPoints(p1.vertices, 100)).toStrictEqual(expected);

        const p2 = shape.constructPolygonAB(expected[1], expected[2], 1);
        expect(roundPoints(p1.vertices, 100)).toStrictEqual(expected);
    });
});
