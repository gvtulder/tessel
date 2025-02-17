import { describe, expect, test } from "@jest/globals";
import { Shape } from "./Shape";
import { Tile } from "./Tile";

const TRIANGLE = new Shape("triangle", [60, 60, 60]);

describe("Tile", () => {
    test("can be constructed", () => {
        const polygon = TRIANGLE.constructPolygonAB(
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            0,
        );
        const tile = new Tile(TRIANGLE, polygon);
        expect(tile.shape).toBe(TRIANGLE);
        expect(tile.centroid).toStrictEqual(polygon.centroid);
        expect(tile.bbox).toStrictEqual(polygon.bbox);
    });

    test("has segments", () => {
        const polygon = TRIANGLE.constructPolygonAB(
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            0,
        );
        const segments = polygon.segment();
        const tile = new Tile(TRIANGLE, polygon, segments);
        expect(tile.segments.map((s) => s.polygon)).toStrictEqual(segments);
    });
});
