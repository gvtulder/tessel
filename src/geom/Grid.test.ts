import { describe, expect, test } from "@jest/globals";
import { GridEdge, GridVertex, SortedCorners } from "./Grid";
import { Tile } from "./Tile";
import { Shape } from "./Shape";

const TRIANGLE = new Shape("triangle", [60, 60, 60]);

describe("SortedCorners", () => {
    test("can be created", () => {
        const sortedCorners = new SortedCorners();
        expect(sortedCorners.length).toBe(0);
    });

    // define three triangles around (0, 0)
    const tile1 = new Tile(
        TRIANGLE,
        TRIANGLE.constructPolygonAB({ x: 0, y: 0 }, { x: 0, y: 1 }, 0),
    );
    const tile2 = new Tile(
        TRIANGLE,
        TRIANGLE.constructPolygonEdge(tile1.polygon.outsideEdges[0], 0),
    );
    const tile3 = new Tile(
        TRIANGLE,
        TRIANGLE.constructPolygonEdge(tile2.polygon.outsideEdges[1], 0),
    );
    test.each([
        [
            [
                [tile1, 0],
                [tile2, 1],
                [tile3, 1],
            ],
            [tile3, tile2, tile1],
        ],
        [
            [
                [tile2, 1],
                [tile3, 1],
                [tile1, 0],
            ],
            [tile3, tile2, tile1],
        ],
    ])("can add tile", (input, output) => {
        const sortedCorners = new SortedCorners();
        expect(sortedCorners.length).toBe(0);
        sortedCorners.addTile(input[0][0] as Tile, input[0][1] as number);
        expect(sortedCorners.length).toBe(1);
        sortedCorners.addTile(input[1][0] as Tile, input[1][1] as number);
        expect(sortedCorners.length).toBe(2);
        sortedCorners.addTile(input[2][0] as Tile, input[2][1] as number);
        expect(sortedCorners.length).toBe(3);
        expect([...sortedCorners.map((c) => c.tile.centroid)]).toStrictEqual(
            output.map((c) => c.centroid),
        );
    });

    test("can get tiles", () => {
        const sortedCorners = new SortedCorners();
        sortedCorners.addTile(tile1, 0);
        sortedCorners.addTile(tile2, 1);
        sortedCorners.addTile(tile3, 1);
        expect(sortedCorners.tiles).toContain(tile1);
        expect(sortedCorners.tiles).toContain(tile2);
        expect(sortedCorners.tiles).toContain(tile3);
    });

    test("can be cloned", () => {
        const sortedCorners = new SortedCorners();
        sortedCorners.addTile(tile1, 0);
        const clone = sortedCorners.clone();
        expect(sortedCorners[0] === clone[0]).toBe(true);
    });
});

describe("GridVertex", () => {
    test("can be constructed", () => {
        const point = { x: 0, y: 2 };
        const vertex = new GridVertex(point);
        expect(vertex.point).toBe(point);
        expect(vertex.corners.length).toBe(0);
        expect(vertex.tiles.length).toBe(0);
    });

    test("can add a tile", () => {
        const tile = new Tile(
            TRIANGLE,
            TRIANGLE.constructPolygonAB({ x: 0, y: 0 }, { x: 0, y: 1 }, 0),
        );
        const point = { x: 0, y: 1 };
        const vertex = new GridVertex(point);
        vertex.addTile(tile, 1);
        expect(vertex.tiles).toStrictEqual([tile]);
        expect(vertex.corners[0].tile).toBe(tile);
    });
});

describe("GridEdge", () => {
    const a = new GridVertex({ x: 0, y: 0 });
    const b = new GridVertex({ x: 0, y: 1 });

    test("can be constructed", () => {
        const edge = new GridEdge(a, b);
        expect(edge.a).toBe(a);
        expect(edge.b).toBe(b);
    });

    test("follows a standard order", () => {
        const edge = new GridEdge(b, a);
        expect(edge.a).toBe(a);
        expect(edge.b).toBe(b);
    });
});
