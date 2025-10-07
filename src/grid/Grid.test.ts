/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, jest, test } from "@jest/globals";
import { Grid, GridEdge, GridVertex, SortedCorners } from "./Grid";
import { PlaceholderTile, Tile } from "./Tile";
import { Polygon } from "../geom/Polygon";
import { GridEventType } from "./GridEvent";
import { mergeBBox, P, weightedSumPoint } from "../geom/math";
import { rotateArray } from "../geom/arrays";
import { SquaresAtlas } from "./atlas/SquaresAtlas";
import { TrianglesAtlas } from "./atlas/TrianglesAtlas";
import { Atlas } from "./Atlas";
import { SnubSquareSourceGrid } from "./source/SnubSquareSourceGrid";

const TRIANGLE = TrianglesAtlas.shapes[0];

describe("SortedCorners", () => {
    test("can be created", () => {
        const sortedCorners = new SortedCorners();
        expect(sortedCorners.length).toBe(0);
    });

    // define three triangles around (0, 0)
    const tile1 = new Tile(
        TRIANGLE,
        TRIANGLE.constructPolygonAB(P(0, 0), P(0, 1), 0),
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
            [tile2, tile1, tile3],
        ],
        [
            [
                [tile2, 1],
                [tile3, 1],
                [tile1, 0],
            ],
            [tile2, tile1, tile3],
        ],
    ])("can add and remove tiles", (input, output) => {
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
        sortedCorners.removeTile(tile2);
        expect(sortedCorners.length).toBe(2);
        expect([...sortedCorners.map((c) => c.tile.centroid)]).toStrictEqual([
            tile1.centroid,
            tile3.centroid,
        ]);
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

    test("can compute the next corner", () => {
        const sortedCorners = new SortedCorners();
        expect(sortedCorners.findNextCorner(tile1)).toBeUndefined();
        sortedCorners.addTile(tile1, 0);
        expect(sortedCorners.findNextCorner(tile1)).toBeUndefined();
        expect(sortedCorners.findNextCorner(tile2)).toBeUndefined();
        sortedCorners.addTile(tile2, 1);
        expect(sortedCorners.findNextCorner(tile1)!.tile).toBe(tile2);
        expect(sortedCorners.findNextCorner(tile2)!.tile).toBe(tile1);
        expect(sortedCorners.findNextCorner(tile3)).toBeUndefined();
        sortedCorners.addTile(tile3, 1);
        expect(sortedCorners.findNextCorner(tile1)!.tile).toBe(tile3);
        expect(sortedCorners.findNextCorner(tile3)!.tile).toBe(tile2);
        expect(sortedCorners.findNextCorner(tile2)!.tile).toBe(tile1);
    });
});

describe("GridVertex", () => {
    test("can be constructed", () => {
        const point = P(0, 2);
        const vertex = new GridVertex(point);
        expect(vertex.point).toBe(point);
        expect(vertex.corners.length).toBe(0);
        expect(vertex.tiles.length).toBe(0);
    });

    test("can add and remove a tile", () => {
        const tile = new Tile(
            TRIANGLE,
            TRIANGLE.constructPolygonAB(P(0, 0), P(0, 1), 0),
        );
        const point = P(0, 1);
        const vertex = new GridVertex(point);
        vertex.addTile(tile, 1);
        expect(vertex.tiles).toStrictEqual([tile]);
        expect(vertex.corners[0].tile).toBe(tile);

        vertex.removeTile(tile);
        expect(vertex.tiles).toStrictEqual([]);
    });

    test("can add and remove a placeholder", () => {
        const placeholder = new PlaceholderTile(
            TRIANGLE,
            TRIANGLE.constructPolygonAB(P(0, 0), P(0, 1), 0),
        );
        const point = P(0, 1);
        const vertex = new GridVertex(point);
        vertex.addTile(placeholder, 1);
        expect([...vertex.placeholders]).toStrictEqual([placeholder]);

        vertex.removeTile(placeholder);
        expect(vertex.placeholders.size).toBe(0);
    });
});

describe("GridEdge", () => {
    const a = new GridVertex(P(0, 0));
    const b = new GridVertex(P(0, 1));

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
    const atlas = TrianglesAtlas;
    const poly1 = TRIANGLE.constructPolygonAB(P(0, 0), P(0, 1), 0);
    const poly2 = TRIANGLE.constructPolygonEdge(poly1.outsideEdges[0], 0);
    const poly3 = TRIANGLE.constructPolygonEdge(poly2.outsideEdges[1], 0);
    const overlappingPoly = new Polygon(P([0.2, 0], [0.5, -0.5], [0.5, 0.5]));

    test("can be created", () => {
        const grid = new Grid(atlas);
        expect(grid.tiles.size).toBe(0);
        expect(grid.frontier.size).toBe(0);
    });

    test("can add tiles", () => {
        const grid = new Grid(atlas);

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
        const grid = new Grid(atlas);
        grid.addTile(TRIANGLE, poly1);
        grid.addTile(TRIANGLE, poly2);
        grid.addTile(TRIANGLE, poly3);

        expect(() => grid.addTile(TRIANGLE, poly1)).toThrow();
    });

    test("can remove tiles", () => {
        const grid = new Grid(atlas);
        const t1 = grid.addTile(TRIANGLE, poly1);
        const t2 = grid.addTile(TRIANGLE, poly2);
        expect(grid.tiles.size).toBe(2);
        expect(grid.frontier.size).toBe(4);
        expect(grid.vertices.size).toBe(4);
        grid.removeTile(t1);
        expect(grid.tiles.size).toBe(1);
        expect(grid.frontier.size).toBe(3);
        expect(grid.vertices.size).toBe(3);
        for (const vertex of grid.vertices.values()) {
            expect(vertex.tiles.indexOf(t1)).toBe(-1);
        }
        grid.removeTile(t2);
        grid.removeTile(t2);
        expect(grid.tiles.size).toBe(0);
        expect(grid.frontier.size).toBe(0);
        grid.addTile(TRIANGLE, poly1);
    });

    test("can check if a new tile would fit", () => {
        const grid = new Grid(atlas);

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
        const grid = new Grid(atlas);

        expect(grid.area).toBeCloseTo(0);
        expect(grid.bbox).toBeUndefined();
        expect(grid.centroid).toBeUndefined();

        const tile1 = grid.addTile(TRIANGLE, poly1);

        expect(grid.area).toBeCloseTo(poly1.area);
        if (!grid.bbox) {
            throw new Error("bboxundefined");
        }
        expect(grid.bbox.minX).toBeCloseTo(poly1.bbox.minX);
        expect(grid.bbox.minY).toBeCloseTo(poly1.bbox.minY);
        expect(grid.bbox.maxX).toBeCloseTo(poly1.bbox.maxX);
        expect(grid.bbox.maxY).toBeCloseTo(poly1.bbox.maxY);
        if (!grid.centroid) {
            throw new Error("centroid undefined");
        }
        expect(grid.centroid.x).toBeCloseTo(poly1.centroid.x);
        expect(grid.centroid.y).toBeCloseTo(poly1.centroid.y);

        const tile2 = grid.addTile(TRIANGLE, poly2);

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

        grid.removeTile(tile1);

        expect(grid.area).toBeCloseTo(poly2.area);
        expect(grid.centroid.x).toBeCloseTo(
            (poly2.area * poly2.centroid.x) / poly2.area,
        );
        expect(grid.centroid.y).toBeCloseTo(
            (poly2.area * poly2.centroid.y) / poly2.area,
        );
    });

    test("dispatches events", () => {
        const addHandler = jest.fn();
        const removeHandler = jest.fn();

        const grid = new Grid(atlas);
        grid.addEventListener(GridEventType.AddTile, addHandler);
        grid.addEventListener(GridEventType.RemoveTile, removeHandler);
        const t1 = grid.addTile(TRIANGLE, poly1);
        grid.addTile(TRIANGLE, poly2);
        grid.addTile(TRIANGLE, poly3);
        grid.removeTile(t1);

        expect(addHandler).toHaveBeenCalledTimes(3);
        expect(removeHandler).toHaveBeenCalledTimes(1);
    });

    test("adds and removes placeholders", () => {
        const grid = new Grid(atlas);

        const placeholder = grid.addPlaceholder(TRIANGLE, poly1);
        expect(grid.placeholders.size).toBe(1);
        expect(grid.bbox).toStrictEqual(poly1.bbox);
        expect(grid.vertices.size).toBe(3);
        expect(grid.edges.size).toBe(3);
        expect(
            [...grid.edges.values()].map((e) =>
                e.placeholders.has(placeholder),
            ),
        ).toStrictEqual([true, true, true]);

        grid.addPlaceholder(TRIANGLE, poly2);
        expect(grid.placeholders.size).toBe(2);
        expect(grid.bbox).toStrictEqual(mergeBBox(poly1.bbox, poly2.bbox));
        expect(grid.vertices.size).toBe(4);
        expect(grid.edges.size).toBe(5);
        expect(
            [...grid.edges.values()].map((e) =>
                e.placeholders.has(placeholder),
            ),
        ).toStrictEqual([true, true, true, false, false]);

        const p3 = grid.addPlaceholder(TRIANGLE, poly3);
        expect(grid.vertices.size).toBe(5);
        expect(grid.edges.size).toBe(7);
        expect(grid.placeholders.size).toBe(3);

        grid.removePlaceholder(p3);
        expect(grid.vertices.size).toBe(4);
        expect(grid.edges.size).toBe(5);
        expect(grid.placeholders.size).toBe(2);
        grid.removePlaceholder(p3);
        expect(grid.placeholders.size).toBe(2);
    });

    test("can add an initial tile", () => {
        const grid = new Grid(atlas);
        const tile = grid.addInitialTile();
        expect(tile.shape).toBe(atlas.shapes[0]);
    });

    test("can add an initial tile from a source grid", () => {
        const atlas = Atlas.fromSourceGrid("", SnubSquareSourceGrid);
        const grid = new Grid(atlas);
        const tile = grid.addInitialTile();
        expect(tile.shape).toBe(atlas.shapes[0]);
        expect(tile.sourcePoint).toBeDefined();
    });

    test("computes combined bbox", () => {
        const grid = new Grid(atlas);

        grid.addPlaceholder(TRIANGLE, poly1);
        expect(grid.placeholders.size).toBe(1);
        expect(grid.area).toBe(poly1.area);
        expect(grid.bbox).toStrictEqual(poly1.bbox);
        expect(grid.centroid).toStrictEqual(poly1.centroid);
        expect(grid.bboxWithoutPlaceholders).toBeUndefined();

        grid.addTile(TRIANGLE, poly2);
        expect(grid.tiles.size).toBe(1);
        expect(grid.placeholders.size).toBe(1);
        expect(grid.area).toBe(poly1.area + poly2.area);
        expect(grid.bbox).toStrictEqual(mergeBBox(poly1.bbox, poly2.bbox));
        expect(grid.centroid).toStrictEqual(
            weightedSumPoint(
                poly1.centroid,
                poly2.centroid,
                poly1.area,
                poly2.area,
            ),
        );
    });

    test("can suggest possible tiles", () => {
        const atlas = SquaresAtlas;
        const shape = atlas.shapes[0];
        const grid = new Grid(atlas);
        const poly1 = shape.constructPolygonXYR(0, 0, 1);
        const tile1 = grid.addTile(shape, poly1);

        for (const edge of tile1.edges) {
            const possibleTiles = grid.computePossibilities(edge);
            expect(possibleTiles.length).toBe(1);
        }

        const poly2 = shape.constructPolygonEdge(poly1.outsideEdges[0], 0);
        grid.addTile(shape, poly2);
        const poly3 = shape.constructPolygonEdge(poly1.outsideEdges[1], 0);
        grid.addTile(shape, poly3);

        for (const edge of grid.frontier) {
            const possibleTiles = grid.computePossibilities(edge);
            expect(possibleTiles.length).toBe(1);
        }
    });

    test("can suggest possible tiles given a source grid", () => {
        const atlas = Atlas.fromSourceGrid("", SnubSquareSourceGrid);
        const grid = new Grid(atlas);
        const tile1 = grid.addInitialTile();
        expect(tile1.shape).toBe(atlas.shapes[0]);
        for (const edge of tile1.edges) {
            const possibleTiles = grid.computePossibilities(edge);
            expect(possibleTiles.length).toBe(1);
            expect(possibleTiles[0].shape).toBe(atlas.shapes[1]);
        }
    });

    test("can generate placeholders", () => {
        const atlas = SquaresAtlas;
        const shape = atlas.shapes[0];
        const grid = new Grid(atlas);
        const poly1 = shape.constructPolygonXYR(0, 0, 1);

        // place initial tile
        const tile1 = grid.addTile(shape, poly1);

        // generate placeholders
        grid.generatePlaceholders();
        expect(grid.placeholders.size).toBe(4);

        // add tile: placeholder should be removed
        const placeholder = [...grid.placeholders][0];
        grid.addTile(placeholder.shape, placeholder.polygon);
        expect(grid.placeholders.size).toBe(3);
        expect(grid.placeholders.has(placeholder)).toBe(false);

        // generate placeholders to connect to new tile
        grid.generatePlaceholders();
        expect(grid.placeholders.size).toBe(6);

        // repeating is a no-op
        grid.generatePlaceholders();
        expect(grid.placeholders.size).toBe(6);

        // clean up placeholders
        grid.removeTile(tile1);
        grid.generatePlaceholders();
        expect(grid.placeholders.size).toBe(4);
    });

    test("can generate triangle placeholders", () => {
        const atlas = TrianglesAtlas;
        const shape = atlas.shapes[0];
        const grid = new Grid(atlas);
        const poly1 = shape.constructPolygonXYR(0, 0, 1);

        // place initial tile
        const tile1 = grid.addTile(shape, poly1);

        // generate placeholders
        grid.generatePlaceholders();
        expect(grid.placeholders.size).toBe(3);

        grid.addTile(
            shape,
            shape.constructPolygonEdge(tile1.polygon.outsideEdges[0], 0),
        );
        grid.generatePlaceholders();
        expect(grid.frontier.size).toBe(4);
        expect(grid.placeholders.size).toBe(4);
    });

    test("finds matching tiles", () => {
        const atlas = TrianglesAtlas;
        const grid = new Grid(atlas);

        const tile1 = grid.addTile(TRIANGLE, poly1);
        const tile2 = grid.addTile(TRIANGLE, poly2);

        expect(grid.findMatchingTile(poly1.vertices, 0.2, true)!.tile).toBe(
            tile1,
        );
        expect(grid.findMatchingTile(poly2.vertices, 0.2, true)!.tile).toBe(
            tile2,
        );
        expect(grid.findMatchingTile(poly3.vertices, 0.2, true)).toBeNull();

        grid.generatePlaceholders();

        expect(grid.findMatchingTile(poly3.vertices, 0.2, false)).toBeNull();
        expect(grid.findMatchingTile(poly3.vertices, 0.2, true)).toBeDefined();
    });

    test("finds matching tiles by centroid", () => {
        const atlas = SquaresAtlas;
        const grid = new Grid(atlas);
        const shape = atlas.shapes[0];
        const unknownShape = TRIANGLE;

        // two squares with centroid (0, 0)
        const poly1 = new Polygon(P([-1, -1], [1, -1], [1, 1], [-1, 1]));
        const poly2 = new Polygon(
            P(
                [0, -Math.SQRT2],
                [Math.SQRT2, 0],
                [0, Math.SQRT2],
                [-Math.SQRT2, 0],
            ),
        );

        const tile1 = grid.addTile(shape, poly1);

        expect(grid.findMatchingTile(poly1.vertices, 0.1, true)!.tile).toBe(
            tile1,
        );
        expect(
            grid.findMatchingTile(poly1.vertices, 0.1, true, unknownShape),
        ).toBeNull();
        expect(grid.findMatchingTile(poly2.vertices, 0.1, true)).toBeNull();
        expect(
            grid.findMatchingTile(poly2.vertices, 0.1, true, undefined, true)!
                .tile,
        ).toBe(tile1);
        expect(
            grid.findMatchingTile(
                poly2.vertices,
                0.1,
                true,
                unknownShape,
                true,
            ),
        ).toBeNull();
    });

    test("checks tile colors", () => {
        const atlas = TrianglesAtlas;
        const grid = new Grid(atlas);
        const tile1 = grid.addTile(TRIANGLE, poly1, poly1.segment());
        const tile2 = grid.addPlaceholder(TRIANGLE, poly2);
        tile1.colors = ["red", "white", "blue"];
        expect(grid.checkColors(tile2, ["red", "white", "blue"])).toBe(true);
        expect(grid.checkColors(tile2, ["white", "red", "blue"])).toBe(false);

        for (let r = 0; r < 3; r++) {
            expect(
                grid.checkColorsWithRotation(
                    tile2,
                    rotateArray(["red", "white", "blue"], -r),
                ),
            ).toStrictEqual([r]);
        }

        expect(
            grid.checkColorsWithRotation(tile2, ["red", "blue", "white"]),
        ).toStrictEqual([0]);
        expect(
            grid.checkColorsWithRotation(tile2, ["blue", "white", "red"]),
        ).toStrictEqual([2]);
        expect(
            grid.checkColorsWithRotation(tile2, ["blue", "blue", "white"]),
        ).toStrictEqual([]);
        expect(
            grid.checkColorsWithRotation(tile2, ["red", "red", "white"]),
        ).toStrictEqual([0, 1]);
    });
});
