/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, jest, test } from "@jest/globals";
import { Shape } from "./Shape";
import { Tile } from "./Tile";
import { TileSet } from "./TileSet";
import { mergeBBox, weightedSumPoint } from "../geom/math";

const TRIANGLE = new Shape("triangle", [60, 60, 60]);

describe("TileSet", () => {
    test("can add and remove tiles", () => {
        const poly1 = TRIANGLE.constructPolygonXYR(0, 0, 1);
        const tile1 = new Tile(TRIANGLE, poly1, poly1.segment());
        const poly2 = TRIANGLE.constructPolygonEdge(poly1.outsideEdges[0], 0);
        const tile2 = new Tile(TRIANGLE, poly2, poly2.segment());

        const set = new TileSet();
        expect(set.size).toBe(0);
        expect(set.has(tile1)).toBe(false);
        expect(set.has(tile2)).toBe(false);
        expect(set.area).toBe(0);
        expect(set.bbox).toBeUndefined();
        expect(set.centroid).toBeUndefined();

        set.add(tile1);
        expect(set.size).toBe(1);
        expect(set.has(tile1)).toBe(true);
        expect(set.has(tile2)).toBe(false);
        expect(set.area).toBe(tile1.area);
        expect(set.bbox).toStrictEqual(tile1.bbox);
        expect(set.centroid).toStrictEqual(tile1.centroid);

        set.add(tile2);
        expect(set.size).toBe(2);
        expect(set.has(tile1)).toBe(true);
        expect(set.has(tile2)).toBe(true);
        expect(set.area).toBe(tile1.area + tile2.area);
        expect(set.bbox).toStrictEqual(mergeBBox(tile1.bbox, tile2.bbox));
        expect(set.centroid).toStrictEqual(
            weightedSumPoint(tile1.centroid, tile2.centroid),
        );

        set.delete(tile1);
        set.delete(tile2);
        set.add(tile2);
        expect(set.size).toBe(1);
        expect(set.has(tile1)).toBe(false);
        expect(set.has(tile2)).toBe(true);
        expect(set.area).toBe(tile2.area);
        expect(set.bbox).toStrictEqual(tile2.bbox);
        expect(set.centroid).toStrictEqual(tile2.centroid);

        set.add(tile2);
        set.delete(tile1);
        set.delete(tile2);
        expect(set.size).toBe(0);
        expect(set.has(tile1)).toBe(false);
        expect(set.has(tile2)).toBe(false);
        expect(set.area).toBe(0);
        expect(set.bbox).toBeUndefined();
        expect(set.centroid).toBeUndefined();

        set.add(tile2);
        expect(set.size).toBe(1);
        set.clear();
        expect(set.size).toBe(0);
    });
});
