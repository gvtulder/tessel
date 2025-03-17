import { Point } from "../geom/math";
import { EdgeKey, edgeToDirectedKey } from "./Grid";

type RingEdge = {
    key: EdgeKey;
    a: Point;
    b: Point;
    previous: RingEdge;
    next: RingEdge;
};

export class Rings {
    edges: Map<EdgeKey, RingEdge>;
    private _rings?: readonly (readonly Point[])[];

    constructor() {
        this.edges = new Map<EdgeKey, RingEdge>();
    }

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

    removeRing(points: readonly Point[]) {
        this.addRing([...points].reverse());
    }

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
