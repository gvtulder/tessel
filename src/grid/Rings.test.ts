import { describe, expect, test } from "@jest/globals";

import { Rings } from "./Rings";
import { P } from "../geom/math";

describe("Rings", () => {
    // coordinates are not important
    const [a, b, c, d, e, f, g] = P(
        [0, 0],
        [0, 1],
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 6],
        [0, 7],
    );

    test("can add a few triangles", () => {
        const ring = new Rings();

        ring.addRing([a, b, c]);
        expect(ring.edges.size).toBe(3);
        const edge = [...ring.edges.values()][0];
        expect(edge.next.next.next).toBe(edge);
        expect(edge.previous.previous.previous).toBe(edge);
        expect(ring.rings).toStrictEqual([[a, b, c]]);

        ring.addRing([b, a, d]);
        expect(ring.edges.size).toBe(4);
        expect(ring.rings).toStrictEqual([[b, c, a, d]]);

        ring.addRing([e, f, g]);
        expect(ring.edges.size).toBe(7);
        expect(ring.rings).toStrictEqual([
            [b, c, a, d],
            [e, f, g],
        ]);

        ring.addRing([f, e, d, a]);
        expect(ring.edges.size).toBe(7);
        expect(ring.rings).toStrictEqual([[b, c, a, f, g, e, d]]);
    });

    test("can remove a triangle", () => {
        const ring = new Rings();
        ring.addRing([a, b, c, d, e]);

        ring.removeRing([b, c, d]);
        expect(ring.edges.size).toBe(4);
        expect(ring.rings).toStrictEqual([[a, b, d, e]]);

        ring.removeRing([a, b, d, e]);
        expect(ring.edges.size).toBe(0);
        expect(ring.rings).toStrictEqual([]);
    });

    test("can create a hole ", () => {
        const ring = new Rings();
        ring.addRing([a, b, c, d]);

        ring.removeRing([e, f, g]);
        expect(ring.edges.size).toBe(7);
        expect(ring.rings).toStrictEqual([
            [a, b, c, d],
            [g, f, e],
        ]);

        ring.removeRing([c, d, e]);
        expect(ring.edges.size).toBe(8);
        expect(ring.rings).toStrictEqual([
            [a, b, c, e, d],
            [g, f, e],
        ]);

        ring.removeRing([c, e, g]);
        expect(ring.edges.size).toBe(7);
        expect(ring.rings).toStrictEqual([[a, b, c, g, f, e, d]]);
    });
});
