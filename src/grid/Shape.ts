import { ArraySet } from "../geom/ArraySet";
import { CornerType } from "./Grid";
import { DEG2RAD, dist, Edge, Point, rad2deg } from "../geom/math";
import { mapToIndex, rotateArray } from "../geom/arrays";
import { Polygon } from "../geom/Polygon";
import { computePolygonSides } from "../geom/polygon/computePolygonSides";

export type ColorPattern = {
    readonly numColors: number;
    readonly segmentColors: readonly (readonly number[])[];
};

export class ColorPatternPerShape extends Map<Shape, ColorPattern> {}

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
     * The interior angles in degrees.
     */
    readonly cornerAnglesDeg: readonly number[];
    /**
     * The length of each side.
     */
    readonly sides: readonly number[];
    /**
     * A nice angle to display the shape.
     */
    readonly displayAngle: number;
    /**
     * A nice angle to for the initial tile played.
     */
    readonly initialAngle: number;
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
     * The rotation steps that make a different shape.
     * The steps indicate a rotation from corner i to i + r.
     */
    readonly uniqueRotations: readonly number[];
    /**
     * The unique ways to color adjacent segments,
     * while maintaining rotation symmetries.
     */
    readonly colorPatterns: readonly ColorPattern[];

    /**
     * Creates a new shape.
     * Angles > 5 will be converted from degrees to radians.
     * Sides measures from corner angle[0] to corner angle[1].
     * The side with length null is computed to close the polygon.
     * @param name a descriptive name
     * @param angles the interior angles of the shape (radians or degrees)
     * @param sides the length of the sides
     * @param colorPatterns
     * @param displayAngle
     * @param initialAngle
     */
    constructor(
        name: string,
        angles: readonly number[],
        sides?: readonly (number | null)[],
        colorPatterns?: readonly ColorPattern[],
        displayAngle?: number,
        initialAngle?: number,
    ) {
        this.name = name;
        this.cornerAngles = angles.map((a) => (a > 5 ? a * DEG2RAD : a));
        this.cornerAnglesDeg = rad2deg(this.cornerAngles);

        displayAngle ||= 0;
        this.displayAngle =
            displayAngle > 5 ? displayAngle * DEG2RAD : displayAngle;
        initialAngle ||= 0;
        this.initialAngle =
            initialAngle > 5 ? initialAngle * DEG2RAD : initialAngle;

        this.sides = this.checkAngles(sides);

        this.rotationalSymmetries = this.computeRotationalSymmetries();
        this.uniqueRotations = this.computeUniqueRotations();
        this.cornerTypes = this.computeCornerTypes();
        this.colorPatterns = colorPatterns || this.computeColorPatterns();
    }

    private computeRotationalSymmetries() {
        const rotationalSymmetries = [0];
        const angles = this.cornerAnglesDeg;
        const sides = this.sides;
        const n = angles.length;
        for (let r = 1; r < n; r++) {
            let ok = true;
            for (let i = 0; ok && i < n; i++) {
                if (
                    angles[i] != angles[(i + r) % n] ||
                    Math.abs(sides[i] - sides[(i + r) % n]) > 1e-5
                ) {
                    ok = false;
                }
            }
            if (ok) {
                rotationalSymmetries.push(r);
            }
        }
        return rotationalSymmetries;
    }

    private computeUniqueRotations() {
        const numUnique =
            this.rotationalSymmetries.length > 1
                ? this.rotationalSymmetries[1]
                : this.cornerAngles.length;
        const uniqueRotations = [];
        for (let r = 0; r < numUnique; r++) {
            uniqueRotations.push(r);
        }
        return uniqueRotations;
    }

    private computeCornerTypes() {
        return this.cornerAngles.map((_, i) => i % this.uniqueRotations.length);
    }

    private computeColorPatterns() {
        const n = this.cornerAngles.length;
        const seen = new Set<string>();
        const colorPatterns: ColorPattern[] = [];
        // attempt to make subsets of 1, 2, 3, 4 neighboring segments
        for (let linked = 1; linked <= n; linked++) {
            // attempt to link segments
            if (n % linked != 0) continue;
            for (const r of this.uniqueRotations) {
                // do not check rotations for patterns with a single color,
                // and patterns with all-unique colors
                if ((linked == 1 || linked == n) && r != 0) {
                    continue;
                }

                // generate pattern
                const segmentColors = new Array<number>(n);
                for (let i = 0; i < n; i++) {
                    segmentColors[(i + n - r) % n] = Math.floor(i / linked);
                }

                // compute unique rotation variants
                const segmentColorsWithRotation = new ArraySet<number>();
                for (const rot of this.rotationalSymmetries) {
                    // rotate and renumber colors to start with 0
                    const variant = mapToIndex(rotateArray(segmentColors, rot));
                    segmentColorsWithRotation.add(variant);
                }

                // store pattern
                const pattern = {
                    numColors: Math.round(n / linked),
                    segmentColors: [...segmentColorsWithRotation.values()],
                };
                const patternKey = JSON.stringify(pattern);
                if (!seen.has(patternKey)) {
                    seen.add(patternKey);
                    colorPatterns.push(pattern);
                }
            }
        }
        return colorPatterns;
    }

    /**
     * Checks if the other shape has the same angles (up to rotation).
     * @param other the other shape
     * @returns true if the other shape can be matched by rotation
     */
    equalAngles(other: Shape): boolean {
        const a = this.cornerAnglesDeg;
        const b = other.cornerAnglesDeg;
        if (a.length != b.length) {
            return false;
        }
        const n = a.length;
        for (let r = 0; r < n - 1; r++) {
            let ok = true;
            for (let i = 0; ok && i < n; i++) {
                if (a[i] != b[(i + r) % n]) {
                    ok = false;
                }
            }
            if (ok) return true;
        }
        return false;
    }

    /**
     * Constructs a polygon from this shape, starting at (x, y)
     * with sides of length, and rotated at the shape's displayAngle.
     * @param x the x coordinate for the first vertex
     * @param y the y coordinate for the first vertex
     * @param length the length of a side
     * @returns a new polygon
     */
    constructPolygonForDisplay(x: number, y: number, length: number): Polygon {
        return this.constructPolygonXYR(x, y, length, this.displayAngle);
    }

    /**
     * Constructs a polygon from this shape, starting at (x, y)
     * with sides of length, and rotated at the shape's initialAngle.
     * @param x the x coordinate for the first vertex
     * @param y the y coordinate for the first vertex
     * @param length the length of a side
     * @returns a new polygon
     */
    constructPolygonForInitialTile(
        x: number,
        y: number,
        length: number,
    ): Polygon {
        return this.constructPolygonXYR(x, y, length, this.initialAngle);
    }

    /**
     * Constructs a polygon from this shape, starting at (x, y)
     * and with sides of length.
     * @param x the x coordinate for the first vertex
     * @param y the y coordinate for the first vertex
     * @param length the length of a side
     * @param angle the angle of the initial side
     * @returns a new polygon
     */
    constructPolygonXYR(
        x: number,
        y: number,
        length: number,
        angle?: number,
    ): Polygon {
        return this.constructPolygonAB(
            { x: x, y: y },
            {
                x: x + Math.cos(angle || 0) * length,
                y: y + Math.sin(angle || 0) * length,
            },
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
        let angle = Math.atan2(b.y - a.y, b.x - a.x);
        const vertices = new Array<Point>(angles.length);
        vertices[edgeIndex] = a;
        vertices[(edgeIndex + 1) % angles.length] = b;
        const scale = Math.hypot(b.x - a.x, b.y - a.y) / this.sides[edgeIndex];
        let x = b.x,
            y = b.y;
        for (let i = 2; i < angles.length; i++) {
            angle += Math.PI - angles[(i + edgeIndex - 1) % angles.length];
            const r = scale * this.sides[(i + edgeIndex - 1) % angles.length];
            vertices[(i + edgeIndex) % angles.length] = {
                x: (x += r * Math.cos(angle)),
                y: (y += r * Math.sin(angle)),
            };
        }
        return new Polygon(vertices);
    }

    private checkAngles(sides?: readonly (number | null)[]): readonly number[] {
        if (this.cornerAngles.length < 3) {
            throw new Error("Invalid shape: need at least three angles.");
        }

        if (this.cornerAngles.some((a) => a <= 0)) {
            throw new Error("Invalid shape: all angles should be positive.");
        }

        return computePolygonSides(this.cornerAngles, sides);
    }
}
