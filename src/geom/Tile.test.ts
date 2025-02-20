import { describe, expect, jest, test } from "@jest/globals";
import { Shape } from "./Shape";
import { Tile, TileColor } from "./Tile";
import { GridEventType } from "./GridEvent";

const TRIANGLE = new Shape("triangle", [60, 60, 60]);

describe("Tile", () => {
    const polygon = TRIANGLE.constructPolygonAB(
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        0,
    );

    test("can be constructed", () => {
        const tile = new Tile(TRIANGLE, polygon);
        expect(tile.shape).toBe(TRIANGLE);
        expect(tile.centroid).toStrictEqual(polygon.centroid);
        expect(tile.bbox).toStrictEqual(polygon.bbox);
    });

    test("has segments", () => {
        const segments = polygon.segment();
        const tile = new Tile(TRIANGLE, polygon, segments);
        expect(tile.segments.map((s) => s.polygon)).toStrictEqual(segments);
    });

    test("has colors", () => {
        const callback = jest.fn();
        const segments = polygon.segment();
        const tile = new Tile(TRIANGLE, polygon, segments);
        expect(tile.colors).toStrictEqual([undefined, undefined, undefined]);
        tile.addEventListener(GridEventType.UpdateTileColors, callback);
        const colors = [TileColor.Black, TileColor.Red, TileColor.Blue];
        tile.colors = colors;
        expect(tile.colors).toStrictEqual(colors);
        expect(callback).toBeCalled();
    });
});
