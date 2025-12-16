/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { GridVertex } from "./GridVertex";
import { PlaceholderTile, Tile } from "./Tile";
import { P } from "../geom/math";
import { TrianglesAtlas } from "./atlas/TrianglesAtlas";

const TRIANGLE = TrianglesAtlas.shapes[0];

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
        expect(vertex.tiles).toEqual([tile]);
        expect(vertex.corners[0].tile).toBe(tile);

        vertex.removeTile(tile);
        expect(vertex.tiles).toEqual([]);
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
