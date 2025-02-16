import { describe, expect, test } from "@jest/globals";
import { Shape } from "./Shape";
import { DEG2RAD } from "./math";

describe("Shape", () => {
    test("can be created", () => {
        const name = "test";
        const angles = [45, 45, 90];
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
    });

    test("converts degrees to radians", () => {
        const degrees = [45, 45, 90];
        const radians = degrees.map((a) => a * DEG2RAD);
        expect(new Shape("", degrees).cornerAngles).toStrictEqual(radians);
        expect(new Shape("", radians).cornerAngles).toStrictEqual(radians);
    });

    test("computes cornerTypes", () => {
        expect(new Shape("", [60, 60, 60]).cornerTypes).toStrictEqual([
            0, 0, 0,
        ]);
        expect(new Shape("", [45, 135, 45, 135]).cornerTypes).toStrictEqual([
            0, 1, 0, 1,
        ]);
    });

    test("computes rotationalSymmetries", () => {
        expect(new Shape("", [60, 60, 60]).rotationalSymmetries).toStrictEqual([
            0, 1, 2,
        ]);
        expect(
            new Shape("", [45, 135, 45, 135]).rotationalSymmetries,
        ).toStrictEqual([0, 2]);
        expect(new Shape("", [45, 45, 90]).rotationalSymmetries).toStrictEqual([
            0,
        ]);
    });
});
