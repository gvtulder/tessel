import { BBox, area, bbox, centroid, Edge, Point, shiftPoints } from "./math";

/**
 * A polygon consists of a number vertices.
 */
export class Polygon {
    /**
     * The vertices that form the polygon, in clockwise order.
     */
    readonly vertices: readonly Point[];

    private _outsideEdges?: readonly Edge[];
    private _edges?: readonly Edge[];
    private _area?: number;
    private _bbox?: BBox;
    private _centroid?: Point;

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
        const n = this.vertices.length;
        const edges = new Array<Edge>(n);
        for (let i = 0; i < n; i++) {
            edges[i] = {
                a: this.vertices[(i + 1) % n],
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
        const n = this.vertices.length;
        const edges = new Array<Edge>(n);
        for (let i = 0; i < n; i++) {
            edges[i] = {
                a: this.vertices[i],
                b: this.vertices[(i + 1) % n],
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
        return this.edges.map((e) => new Polygon([e.a, e.b, c]));
    }

    /**
     * Returns a new polygon with points shifted in direction dx and dy.
     */
    toShifted(dx: number, dy: number): Polygon {
        return new Polygon(shiftPoints(this.vertices, dx, dy));
    }
}
