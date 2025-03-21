import { Point } from "../geom/math";
import { EdgeKey, edgeToDirectedKey } from "./Grid";

type RingEdge = {
    key: EdgeKey;
    a: Point;
    b: Point;
    previous: RingEdge;
    next: RingEdge;
};

/**
 * Maintains a set of linked edges, tracking the boundary
 * rings (outer for shapes, inner for holes) on the grid.
 */
export class Rings {
    /**
     * The edges currently registered.
     */
    edges: Map<EdgeKey, RingEdge>;
    /**
     * Cache variable for the get rings function.
     */
    private _rings?: readonly (readonly Point[])[];

    constructor() {
        this.edges = new Map<EdgeKey, RingEdge>();
    }

    /**
     * Adds a ring of edges to the grid. Merges with existing
     * rings if applicable.
     * @param points the sequence of points forming the new ring
     */
    addRing(points: readonly Point[]): void {
        const edges = this.pointsToRing(points);
        if (this.edges.size > edges.length) {
            // perhaps we must merge with an existing ring
            for (const edge of edges) {
                // look for the same edge in the reverse direction
                const reverseKey = edgeToDirectedKey(edge.b, edge.a);
                const reverse = this.edges.get(reverseKey);
                if (reverse) {
                    // these edges cancel out and must now be inside the ring
                    reverse.previous.next = edge.next;
                    edge.next.previous = reverse.previous;
                    edge.previous.next = reverse.next;
                    reverse.next.previous = edge.previous;
                    this.edges.delete(edge.key);
                    this.edges.delete(reverse.key);
                }
            }
        }
        this._rings = undefined;
    }

    /**
     * Removes a ring from the grid.
     * @param points the sequence of points forming the ring to be removed
     */
    removeRing(points: readonly Point[]) {
        this.addRing([...points].reverse());
    }

    /**
     * Returns the list of rings currently managed.
     * Clockwise rings indicate outer rings, counter-clockwise
     * indicates a hole.
     */
    get rings(): readonly (readonly Point[])[] {
        if (this._rings) return this._rings;
        const rings = [];
        const seen = new Set<RingEdge>();
        for (const edge of this.edges.values()) {
            if (seen.has(edge)) continue;
            seen.add(edge);
            const ring = [edge.a];
            let next = edge.next;
            while (next !== edge) {
                seen.add(next);
                ring.push(next.a);
                next = next.next;
            }
            rings.push(ring);
        }
        this._rings = rings;
        return rings;
    }

    /**
     * Converts the list of points to a list edges,
     * creating new linked edges if necessary.
     */
    private pointsToRing(points: readonly Point[]): RingEdge[] {
        const n = points.length;
        const edges = new Array<RingEdge>(n);
        for (let i = 0; i < n; i++) {
            const a = points[i];
            const b = points[(i + 1) % n];
            const key = edgeToDirectedKey(a, b);
            if (this.edges.has(key)) {
                throw new Error("this edge already exists");
            }
            const edge = {
                key: key,
                a: a,
                b: b,
                previous: undefined!,
                next: undefined!,
            };
            this.edges.set(key, edge);
            edges[i] = edge;
        }
        for (let i = 0; i < n; i++) {
            edges[i].previous = edges[(i + n - 1) % n];
            edges[i].next = edges[(i + 1) % n];
        }
        return edges;
    }
}

/**
 * Returns the outermost ring formed by the smaller shapes.
 * @param points the polygon vertices forming the rings
 * @returns the outer ring
 */
export function computeRing(
    points: readonly (readonly Point[])[],
): readonly Point[] {
    const ringSet = new Rings();
    for (const ring of points) {
        ringSet.addRing(ring);
    }
    const rings = ringSet.rings;
    if (rings.length != 1) {
        throw new Error(`Expected to find one ring, but found ${rings.length}`);
    }
    return rings[0];
}
