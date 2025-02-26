import { describe, expect, test } from "@jest/globals";
import { Polygon } from "./Polygon";
import { area, bbox, centroid, Point } from "./math";

describe("Polygon", () => {
    const triangle = [
        { x: 0, y: 0 },
        { x: 1, y: -1 },
        { x: 2, y: 1 },
    ];
    const square = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
    ];

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

    test("computes overlap", () => {
        const poly = new Polygon(triangle);
        expect(poly.overlapArea(poly)).toBe(poly.area);
        const sq = new Polygon(square);
        const tr = new Polygon(square.slice(0, 3));
        expect(sq.overlapArea(sq)).toBe(sq.area);
        expect(sq.overlapArea(tr)).toBe(tr.area);
        expect(tr.overlapArea(sq)).toBe(tr.area);
        expect(
            sq.overlapArea([
                { x: 2, y: 2 },
                { x: 3, y: 2 },
                { x: 2.5, y: 3 },
            ]),
        ).toBe(0);
    });
});
