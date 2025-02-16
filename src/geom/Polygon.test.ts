import { describe, expect, test } from "@jest/globals";
import { Polygon } from "./Polygon";
import { bbox, centroid } from "./math";

describe("Polygon", () => {
    const vertices = [
        { x: 0, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: -1 },
    ];

    test("can be created", () => {
        const poly = new Polygon(vertices);
    });

    test("returns edges", () => {
        const poly = new Polygon(vertices);
        expect(poly.edges).toStrictEqual([
            { a: vertices[0], b: vertices[1] },
            { a: vertices[1], b: vertices[2] },
            { a: vertices[2], b: vertices[0] },
        ]);
    });

    test("returns outside edges", () => {
        const poly = new Polygon(vertices);
        expect(poly.outsideEdges).toStrictEqual([
            { a: vertices[1], b: vertices[0] },
            { a: vertices[2], b: vertices[1] },
            { a: vertices[0], b: vertices[2] },
        ]);
    });

    test("computes a bounding box", () => {
        const poly = new Polygon(vertices);
        expect(poly.bbox).toStrictEqual(bbox(vertices));
    });

    test("computes a centroid", () => {
        const poly = new Polygon(vertices);
        expect(poly.centroid).toStrictEqual(centroid(vertices));
    });
});