import { describe, expect, test } from "@jest/globals";
import { P, Point } from "../math";
import { Polygon } from "../Polygon";
import { matchPoints } from "./matchPoints";

describe("matchPoints", () => {
    const triangle = P([0, 0], [1, -1], [2, 1]);
    const square = P([0, 0], [0, 1], [1, 1], [1, 0]);

    test.each([
        [triangle, triangle, 0, 0],
        [triangle, square, null, null],
        [triangle, [triangle[2], triangle[0], triangle[1]], 1, 0],
        [triangle, [triangle[1], triangle[2], triangle[0]], 2, 0],
        [triangle, P([0.2, 0], [1.2, -1], [2.2, 1]), 0, 0.2],
    ])(
        "matches points",
        (
            a: Point[],
            b: Point[],
            offset: number | null,
            dist: number | null,
        ) => {
            const poly = new Polygon(a);
            const m = matchPoints(poly.vertices, b);
            if (offset === null || dist === null) {
                expect(m).toBeNull();
            } else if (m === null) {
                throw new Error("nothing matched, m is null");
            } else {
                expect(m.dist).toBeCloseTo(dist);
                expect(m.offset).toBe(offset);
            }
        },
    );
});
