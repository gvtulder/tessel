// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { describe, expect, jest, test } from "@jest/globals";
import { Shape } from "./Shape";
import { PlaceholderTile, Tile } from "./Tile";
import { P } from "../geom/math";
import { Grid } from "./Grid";
import { TrianglesAtlas } from "./atlas/TrianglesAtlas";

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
        expect(tile.segments!.map((s) => s.polygon)).toStrictEqual(segments);
    });

    test("has colors", () => {
        const callback = jest.fn();
        const segments = polygon.segment();
        const tile = new Tile(TRIANGLE, polygon, segments);
        expect(tile.colors).toStrictEqual([undefined, undefined, undefined]);
        tile.onUpdateColor = callback;
        const colors = ["black", "red", "blue"];
        tile.colors = colors;
        expect(tile.colors).toStrictEqual(colors);
        expect(callback).toHaveBeenCalled();
        tile.colors = "red";
        expect(tile.colors).toStrictEqual(["red", "red", "red"]);
    });

    test("can compute neighbors", () => {
        const grid = new Grid(TrianglesAtlas);
        const shape = grid.atlas.shapes[0];

        // one triangle with a triangle at each of edge
        const poly1 = shape.constructPolygonXYR(0, 0, 1);
        const tile1 = grid.addTile(shape, poly1, poly1.segment());
        const poly2 = shape.constructPolygonEdge(poly1.outsideEdges[0], 0);
        const tile2 = grid.addTile(shape, poly2, poly2.segment());
        const poly3 = shape.constructPolygonEdge(poly1.outsideEdges[1], 0);
        const tile3 = grid.addTile(shape, poly3, poly3.segment());
        const poly4 = shape.constructPolygonEdge(poly1.outsideEdges[2], 0);
        const tile4 = grid.addTile(shape, poly4, poly4.segment());

        // tile neighbors
        expect(tile1.neighbors.size).toBe(3);
        expect(tile2.neighbors.size).toBe(1);
        expect(tile3.neighbors.size).toBe(1);
        expect(tile4.neighbors.size).toBe(1);

        // tile segment neighbors
        if (!tile1.segments) {
            throw new Error("no tile segments found");
        }
        if (!tile2.segments) {
            throw new Error("no tile segments found");
        }
        expect(tile1.segments[0].getNeighbors()).toStrictEqual([
            tile2.segments[0],
        ]);
        expect(tile2.segments[0].getNeighbors(false)).toStrictEqual([
            tile1.segments[0],
        ]);
        expect(tile1.segments[0].getNeighbors(true)).toStrictEqual([
            tile1.segments[2],
            tile1.segments[1],
            tile2.segments[0],
        ]);
        expect(tile2.segments[0].getNeighbors(true)).toStrictEqual([
            tile2.segments[2],
            tile2.segments[1],
            tile1.segments[0],
        ]);
        expect(tile2.segments[1].getNeighbors(true)).toStrictEqual([
            tile2.segments[0],
            tile2.segments[2],
        ]);
        expect(tile2.segments[1].getNeighbors(true, true)).toStrictEqual([
            tile2.segments[0],
            tile2.segments[2],
            null,
        ]);
        expect(tile2.segments[1].getNeighbors(false, true)).toStrictEqual([
            null,
        ]);
    });
});

describe("PlaceholderTile", () => {
    const polygon = TRIANGLE.constructPolygonAB(P(0, 0), P(0, 1), 0);

    test("can be constructed", () => {
        const tile = new PlaceholderTile(TRIANGLE, polygon);
        expect(tile.shape).toBe(TRIANGLE);
        expect(tile.segments).toBeUndefined();
        expect(tile.colors).toBeUndefined();
    });
});
