import polygonClipping from "polygon-clipping";
import { BBox, area, bbox, centroid, Edge, Point } from "./math";

/**
 * A polygon consists of a number vertices.
 */
export class Polygon {
    /**
     * The vertices that form the polygon, in clockwise order.
     */
    readonly vertices: readonly Point[];

    private _outsideEdges: readonly Edge[];
    private _edges: readonly Edge[];
    private _area: number;
    private _bbox: BBox;
    private _centroid: Point;

    /**
     * Creates a new polygon with the given vertices.
     * @param vertices vertices in clockwise order
     */
    constructor(vertices: readonly Point[]) {
        this.vertices = vertices;
    }

    /**
     * The outside edges of the polygon.
     * An outside edge is the same as the interior edge, but in reverse.
     * Edge i is the edge from vertex i + 1 to i.
     */
    get outsideEdges(): readonly Edge[] {
        if (this._outsideEdges !== undefined) return this._outsideEdges;
        const edges = new Array<Edge>(this.vertices.length);
        for (let i = 0; i < this.vertices.length; i++) {
            edges[i] = {
                a: this.vertices[(i + 1) % this.vertices.length],
                b: this.vertices[i],
            };
        }
        return (this._outsideEdges = edges);
    }

    /**
     * The inside edges of the polygon.
     * Edge i is the edge from vertex i to i + 1.
     */
    get edges(): readonly Edge[] {
        if (this._edges !== undefined) return this._edges;
        const edges = new Array<Edge>(this.vertices.length);
        for (let i = 0; i < this.vertices.length; i++) {
            edges[i] = {
                a: this.vertices[i],
                b: this.vertices[(i + 1) % this.vertices.length],
            };
        }
        return (this._edges = edges);
    }

    /**
     * The area of this polygon.
     */
    get area(): number {
        return (this._area ||= area(this.vertices));
    }

    /**
     * The bounding box of this polygon.
     */
    get bbox(): BBox {
        return (this._bbox ||= bbox(this.vertices));
    }

    /**
     * The centroid of this polygon.
     */
    get centroid(): Point {
        return (this._centroid ||= centroid(this.vertices));
    }

    /**
     * Returns polygon segments, connecting each edge to the centroid.
     */
    segment(): Polygon[] {
        const c = this.centroid;
        const edges = this.edges;
        const segments = new Array<Polygon>(edges.length);
        for (let i = 0; i < edges.length; i++) {
            segments[i] = new Polygon([edges[i].a, edges[i].b, c]);
        }
        return segments;
    }

    /**
     * Return the overlap area between this polygon and the other polygon.
     * @param points a polygon, or series of points
     * @returns the area of overlap (ignoring holes, if any)
     */
    overlapArea(points: readonly Point[] | Polygon): number {
        if (points instanceof Polygon) {
            points = points.vertices;
        }
        const intersect = polygonClipping.intersection(
            [[this.vertices.map((p) => [p.x, p.y])]],
            [[points.map((p) => [p.x, p.y])]],
        );
        let sumArea = 0;
        // sum over all polygons
        for (const poly of intersect) {
            let polyA = 0;
            // take the area of the largest ring (ignore holes)
            for (const ring of poly) {
                const ringA = area(ring.map(([x, y]) => ({ x, y })));
                if (ringA > polyA) polyA = ringA;
            }
            sumArea += polyA;
        }
        return sumArea;
    }
}
