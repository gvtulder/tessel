/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { SortedCorners } from "./SortedCorners";
import { Tile } from "./Tile";
import { P } from "../geom/math";
import { TrianglesAtlas } from "./atlas/TrianglesAtlas";

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
