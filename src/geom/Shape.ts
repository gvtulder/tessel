import { CornerType } from "./Grid";
import { DEG2RAD, dist, Edge, Point } from "./math";
import { Polygon } from "./Polygon";

/**
 * A Shape describes a geometric shape, based on the interior angles.
 */
export class Shape {
    /**
     * A descriptive name for the shape.
     */
    readonly name: string;
    /**
     * The interior angles in radians.
     */
    readonly cornerAngles: readonly number[];
    /**
     * The type of each corner.
     * Corners that are the same after rotating the shape receive the same value.
     */
    readonly cornerTypes: readonly CornerType[];
    /**
     * The rotation steps that make the same shape.
     * The steps indicate a rotation from corner i to i + r.
     */
    readonly rotationalSymmetries: readonly number[];

    /**
     * Creates a new shape.
     * Angles > 5 will be converted from degrees to radians.
     * @param name a descriptive name
     * @param angles the interior angles of the shape (radians or degrees)
     */
    constructor(name: string, angles: readonly number[]) {
        this.name = name;
        this.cornerAngles = angles.map((a) => (a > 5 ? a * DEG2RAD : a));

        this.checkAngles();

        // analyze unique angles
        const cornerTypesMap = new Map<number, number>();
        this.cornerTypes = angles.map((a) => {
            let idx = cornerTypesMap.get(a);
            if (idx === undefined) {
                idx = cornerTypesMap.size;
                cornerTypesMap.set(a, idx);
            }
            return idx;
        });

        // analyze rotational symmetries
        const rotations = [0];
        const n = angles.length;
        for (let r = 1; r < n; r++) {
            let ok = true;
            for (let i = 0; i < n; i++) {
                if (angles[i] != angles[(i + r) % n]) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                rotations.push(r);
            }
        }
        this.rotationalSymmetries = rotations;
    }

    /**
     * Constructs a polygon from this shape, starting at (x, y)
     * and with sides of length.
     * @param x the x coordinate for the first vertex
     * @param y the y coordinate for the first vertex
     * @param length the length of a side
     * @returns a new polygon
     */
    constructPolygonXYR(x: number, y: number, length: number): Polygon {
        return this.constructPolygonAB(
            { x: x, y: y },
            { x: x + length, y: y },
            0,
        );
    }

    /**
     * Constructs a polygon from this shape, with the edge at edgeIndex
     * placed at ab.
     * @param ab the location of the edge
     * @param edgeIndex the index of the edge
     * @returns a new polygon
     */
    constructPolygonEdge(ab: Edge, edgeIndex: number): Polygon {
        return this.constructPolygonAB(ab.a, ab.b, edgeIndex);
    }

    /**
     * Constructs a polygon from this shape, with the edge at edgeIndex
     * placed from point a to point b.
     * @param a the first vertex of the edge
     * @param b the second vertex of the edge
     * @param edgeIndex the index of the edge
     * @returns a new polygon
     */
    constructPolygonAB(a: Point, b: Point, edgeIndex: number): Polygon {
        const angles = this.cornerAngles;
        const r = Math.hypot(b.x - a.x, b.y - a.y);
        let angle = Math.atan2(b.y - a.y, b.x - a.x);
        const vertices = new Array<Point>(angles.length);
        vertices[edgeIndex] = a;
        vertices[(edgeIndex + 1) % angles.length] = b;
        let x = b.x,
            y = b.y;
        for (let i = 2; i < angles.length; i++) {
            angle += Math.PI - angles[(i + edgeIndex) % angles.length];
            vertices[(i + edgeIndex) % angles.length] = {
                x: (x += r * Math.cos(angle)),
                y: (y += r * Math.sin(angle)),
            };
        }
        return new Polygon(vertices);
    }

    private checkAngles() {
        if (this.cornerAngles.length < 3) {
            throw new Error("Invalid shape: need at least three angles.");
        }

        if (this.cornerAngles.some((a) => a <= 0)) {
            throw new Error("Invalid shape: all angles should be positive.");
        }

        const sum = this.cornerAngles.reduceRight((a, b) => a + b);
        if (Math.abs(sum - (this.cornerAngles.length - 2) * Math.PI) > 1e-5) {
            throw new Error(
                "Invalid shape: angles should sum to (n - 2) * 180 degrees.",
            );
        }

        const poly = this.constructPolygonAB({ x: 0, y: 0 }, { x: 1, y: 1 }, 0);
        const v = poly.vertices;
        if (Math.abs(dist(v[0], v[1]) - dist(v[0], v[v.length - 1])) > 1e-5) {
            throw new Error("Invalid shape: expecting equilateral polygon.");
        }
    }
}
