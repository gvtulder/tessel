/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { area, bbox, centroid, P, Point, shiftPoints } from "./math";
import { Polygon } from "./Polygon";
import * as zod from "zod/v4-mini";

describe("Polygon", () => {
    const triangle: readonly Point[] = P([0, 0], [1, -1], [2, 1]);
    const square: readonly Point[] = P([0, 0], [0, 1], [1, 1], [1, 0]);

    test("can be created", () => {
        const poly = new Polygon(triangle);
    });

    test("returns edges", () => {
        const poly = new Polygon(triangle);
        const result = [
            { a: triangle[0], b: triangle[1] },
            { a: triangle[1], b: triangle[2] },
            { a: triangle[2], b: triangle[0] },
        ];
        expect(poly.edges).toStrictEqual(result);
        expect(poly.edges).toStrictEqual(result);
    });

    test("returns outside edges", () => {
        const poly = new Polygon(triangle);
        const result = [
            { a: triangle[1], b: triangle[0] },
            { a: triangle[2], b: triangle[1] },
            { a: triangle[0], b: triangle[2] },
        ];
        expect(poly.outsideEdges).toStrictEqual(result);
        expect(poly.outsideEdges).toStrictEqual(result);
    });

    test("computes an area", () => {
        const poly = new Polygon(triangle);
        const result = area(triangle);
        expect(poly.area).toStrictEqual(result);
        expect(poly.area).toStrictEqual(result);
    });

    test("computes a bounding box", () => {
        const poly = new Polygon(triangle);
        const result = bbox(triangle);
        expect(poly.bbox).toStrictEqual(result);
        expect(poly.bbox).toStrictEqual(result);
    });

    test("computes a centroid", () => {
        const poly = new Polygon(triangle);
        const result = centroid(triangle);
        expect(poly.centroid).toStrictEqual(result);
        expect(poly.centroid).toStrictEqual(result);
    });

    test.each([triangle, square])(
        "can be divided in segments",
        (...vertices: Point[]) => {
            const poly = new Polygon(vertices);
            const segments = poly.segment();
            expect(segments.length).toBe(vertices.length);
            for (let i = 0; i < vertices.length; i++) {
                expect(segments[i].edges[0]).toStrictEqual(poly.edges[i]);
                expect(segments[i].vertices[2]).toStrictEqual(poly.centroid);
            }
        },
    );

    test("can be shifted", () => {
        const poly = new Polygon(triangle);
        const expected = shiftPoints(poly.vertices, 2, 10);
        const shifted = poly.toShifted(2, 10);
        expect(poly.vertices).toStrictEqual(triangle);
        expect(shifted.vertices).toStrictEqual(expected);
    });

    test("can be saved", () => {
        const poly = new Polygon(triangle);
        let saved = zod.encode(Polygon.codec, poly);
        let restored = zod.decode(Polygon.codec, saved);
        expect(restored).toStrictEqual(poly);
        saved = poly.save();
        restored = Polygon.restore(saved);
        expect(restored).toStrictEqual(poly);
    });
});
