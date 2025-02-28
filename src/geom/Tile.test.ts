import { describe, expect, jest, test } from "@jest/globals";
import { Shape } from "./Shape";
import { Tile, TileColor } from "./Tile";
import { GridEventType } from "./GridEvent";
import { P } from "./math";

const TRIANGLE = new Shape("triangle", [60, 60, 60]);

describe("Tile", () => {
    const polygon = TRIANGLE.constructPolygonAB(P(0, 0), P(0, 1), 0);

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
        const colors = ["black", "red", "blue"];
        tile.colors = colors;
        expect(tile.colors).toStrictEqual(colors);
        expect(callback).toBeCalled();
    });
});
