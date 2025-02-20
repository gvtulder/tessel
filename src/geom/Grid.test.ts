import { describe, expect, test } from "@jest/globals";
import { Grid, GridEdge, GridVertex, SortedCorners } from "./Grid";
import { Tile } from "./Tile";
import { Shape } from "./Shape";
import { Polygon } from "./Polygon";

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

describe("Grid", () => {
    // define three triangles around (0, 0)
    const poly1 = TRIANGLE.constructPolygonAB(
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        0,
    );
    const poly2 = TRIANGLE.constructPolygonEdge(poly1.outsideEdges[0], 0);
    const poly3 = TRIANGLE.constructPolygonEdge(poly2.outsideEdges[1], 0);
    const overlappingPoly = new Polygon([
        { x: 0.2, y: 0 },
        { x: 0.5, y: -0.5 },
        { x: 0.5, y: 0.5 },
    ]);

    test("can be created", () => {
        const grid = new Grid();
        expect(grid.tiles.size).toBe(0);
        expect(grid.frontier.size).toBe(0);
    });

    test("can add tiles", () => {
        const grid = new Grid();

        grid.addTile(TRIANGLE, poly1);
        expect(grid.tiles.size).toBe(1);
        expect(grid.frontier.size).toBe(3);
        expect(grid.bbox).toStrictEqual(poly1.bbox);

        grid.addTile(TRIANGLE, poly2);
        expect(grid.tiles.size).toBe(2);
        expect(grid.frontier.size).toBe(4);

        grid.addTile(TRIANGLE, poly3);
        expect(grid.tiles.size).toBe(3);
        expect(grid.frontier.size).toBe(5);
    });

    test("checks for overlapping edges before adding", () => {
        const grid = new Grid();
        grid.addTile(TRIANGLE, poly1);
        grid.addTile(TRIANGLE, poly2);
        grid.addTile(TRIANGLE, poly3);

        expect(() => grid.addTile(TRIANGLE, poly1)).toThrowError();
    });

    test("can remove tiles", () => {
        const grid = new Grid();
        const t1 = grid.addTile(TRIANGLE, poly1);
        const t2 = grid.addTile(TRIANGLE, poly2);
        expect(grid.tiles.size).toBe(2);
        expect(grid.frontier.size).toBe(4);
        grid.removeTile(t1);
        expect(grid.tiles.size).toBe(1);
        expect(grid.frontier.size).toBe(3);
        grid.removeTile(t2);
        grid.removeTile(t2);
        expect(grid.tiles.size).toBe(0);
        expect(grid.frontier.size).toBe(0);
        grid.addTile(TRIANGLE, poly1);
    });

    test("can check if a new tile would fit", () => {
        const grid = new Grid();

        // add correct tiles
        expect(grid.checkFit(TRIANGLE, poly1)).toBe(true);
        grid.addTile(TRIANGLE, poly1);
        expect(grid.checkFit(TRIANGLE, poly2)).toBe(true);
        grid.addTile(TRIANGLE, poly2);
        expect(grid.checkFit(TRIANGLE, poly3)).toBe(true);
        grid.addTile(TRIANGLE, poly3);

        // tile reusing an existing edge
        expect(grid.checkFit(TRIANGLE, poly1)).toBe(false);

        // tile with overlap
        expect(grid.checkFit(TRIANGLE, overlappingPoly)).toBe(false);
    });

    test("updates area, bbox, centroid", () => {
        const grid = new Grid();

        expect(grid.area).toBeCloseTo(0);
        expect(grid.bbox).toBeUndefined();
        expect(grid.centroid).toBeUndefined();

        grid.addTile(TRIANGLE, poly1);

        expect(grid.area).toBeCloseTo(poly1.area);
        expect(grid.bbox.minX).toBeCloseTo(poly1.bbox.minX);
        expect(grid.bbox.minY).toBeCloseTo(poly1.bbox.minY);
        expect(grid.bbox.maxX).toBeCloseTo(poly1.bbox.maxX);
        expect(grid.bbox.maxY).toBeCloseTo(poly1.bbox.maxY);
        expect(grid.centroid.x).toBeCloseTo(poly1.centroid.x);
        expect(grid.centroid.y).toBeCloseTo(poly1.centroid.y);

        grid.addTile(TRIANGLE, poly2);

        expect(grid.area).toBeCloseTo(poly1.area + poly2.area);
        expect(grid.bbox.minX).toBeCloseTo(
            Math.min(poly1.bbox.minX, poly2.bbox.minX),
        );
        expect(grid.bbox.minY).toBeCloseTo(
            Math.min(poly1.bbox.minY, poly2.bbox.minY),
        );
        expect(grid.bbox.maxX).toBeCloseTo(
            Math.max(poly1.bbox.maxX, poly2.bbox.maxX),
        );
        expect(grid.bbox.maxY).toBeCloseTo(
            Math.max(poly1.bbox.maxY, poly2.bbox.maxY),
        );
        expect(grid.centroid.x).toBeCloseTo(
            (poly1.area * poly1.centroid.x + poly2.area * poly2.centroid.x) /
                (poly1.area + poly2.area),
        );
        expect(grid.centroid.y).toBeCloseTo(
            (poly1.area * poly1.centroid.y + poly2.area * poly2.centroid.y) /
                (poly1.area + poly2.area),
        );
    });
});
