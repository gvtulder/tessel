/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG, shuffle } from "../../geom/RandomSampler";
import { parseShapeDefinition } from "../Atlas";
import { Shape } from "../Shape";
import { SourceGrid, SourcePoint } from "../SourceGrid";
import { dist, Point } from "../../geom/math";

const wide = parseShapeDefinition({
    name: "rhombus-wide",
    angles: [72, 108, 72, 108],
    frequency: 5,
    preferredAngles: {
        display: 200,
        setupAtlas: 200,
        mainMenu: 200,
    },
});

const narrow = parseShapeDefinition({
    name: "rhombus-narrow",
    angles: [36, 144, 36, 144],
    frequency: 3,
});

// implements a De Bruin grid

type DeBruijnGridLine = {
    index: number;
    offset: number;
};

export class Penrose3SourceGrid extends SourceGrid {
    static readonly shapes = [wide, narrow] as readonly Shape[];
    static readonly shapeFrequencies = new Map([
        [wide, 5],
        [narrow, 3],
    ]) as ReadonlyMap<Shape, number>;

    dimensions: number;
    sigma!: number[];

    angles!: number[];
    cos!: number[];
    sin!: number[];
    sinDiff!: number[][];
    cscDiff!: number[][];

    shapeForLines!: ({ shape: Shape; startEdge: number } | null)[][];

    static create(prng?: PRNG) {
        return new Penrose3SourceGrid(prng);
    }

    constructor(prng?: PRNG) {
        super(prng);
        this.dimensions = 5;
        this.generateSigma();
        this.precomputeAngles();
        this.precomputeShapes();
    }

    private generateSigma() {
        // https://www.mathpages.com/home/kmath621/kmath621.htm
        // if the values of σj are all rational and distinct,
        // and no two of them sum to an integer, it is
        // impossible for three of the grid lines to intersect
        // at any point.
        // all sigma must sum to zero.

        const dimensions = this.dimensions;
        const EPSILON = 1e-5;
        const MAX_DEN = 30;
        const sigma: { num: number; den: number }[] = new Array(dimensions);

        let ok: boolean;
        do {
            // use the first sigma to ensure all sigmas sum to one
            sigma[0] = { num: 0, den: 1 };
            for (let i = 1; i < dimensions; i++) {
                // choose a random sigma[i]
                const den = Math.ceil(this.prng() * MAX_DEN + 1);
                const num = Math.round((this.prng() - 0.5) * 2 * den);
                sigma[i] = { num, den };
                // subtract from sigma[0]
                sigma[0] = {
                    num: sigma[0].num * den - num * sigma[0].den,
                    den: den * sigma[0].den,
                };
            }

            // check no sigmas are zero, all are different, and no two sigmas sum to one
            ok = true;
            for (let i = 0; ok && i < dimensions; i++) {
                // should not be zero or one
                if (
                    sigma[i].num == 0 ||
                    Math.abs(sigma[i].num) == sigma[i].den
                ) {
                    ok = false;
                }
                for (let j = 0; ok && j < dimensions; j++) {
                    // sum should be non-zero and not one
                    const sum = Math.abs(
                        sigma[i].num * sigma[j].den +
                            sigma[j].num +
                            sigma[i].den,
                    );
                    if (sum == 0 || sum == sigma[i].den * sigma[j].den) {
                        ok = false;
                    }
                }
            }

            /*
            if (!ok) {
                console.log(ok ? "sigma OK" : "sigma not OK", sigma);
            }
            */
        } while (!ok);

        // since sigma[0] is used to sum to 0,
        // shuffle to remove any bias from the order
        shuffle(sigma, this.prng);

        // console.log(ok ? "sigma OK" : "sigma not OK", sigma);
        this.sigma = sigma.map(({ num, den }) => num / den);
    }

    getOrigin(): SourcePoint {
        return this.getPoint({ index: 0, offset: 0 }, { index: 1, offset: 1 });
    }

    getPoint(
        lineA: DeBruijnGridLine,
        lineB: DeBruijnGridLine,
    ): Penrose3SourcePoint {
        if (lineA.index > lineB.index) {
            const l = lineA;
            lineA = lineB;
            lineB = l;
        }
        const key = computeKey(lineA, lineB);
        let point = this.points.get(key);
        if (!point) {
            point = new Penrose3SourcePoint(this, lineA, lineB);
            this.points.set(key, point);
        }
        return point as Penrose3SourcePoint;
    }

    private precomputeAngles() {
        const angles: number[] = new Array(this.dimensions);
        for (let i = 0; i < this.dimensions; i++) {
            // add small value to prevent horizontal lines
            angles[i] = ((i + 0.1) * Math.PI) / this.dimensions;
        }
        this.angles = angles;
        this.cos = angles.map(Math.cos);
        this.sin = angles.map(Math.sin);
        this.sinDiff = angles.map((a) => angles.map((b) => Math.sin(a - b)));
        this.cscDiff = angles.map((a) =>
            angles.map((b) => 1 / Math.sin(a - b)),
        );
    }

    private precomputeShapes() {
        this.shapeForLines = this.angles.map((a) =>
            this.angles.map((b) => {
                // compute angle of a vertex starting a parallel edge
                const angle = (b - a + 2 * Math.PI) % Math.PI;
                if (angle == 0) return null;
                const otherAngle = angle;

                // find the shape for this angle
                let shape: Shape | null = null;
                let startEdge: number = -1;
                for (const s of Penrose3SourceGrid.shapes) {
                    if (Math.abs(s.cornerAngles[0] - angle) < 1e-3) {
                        shape = s;
                        startEdge = 0;
                    } else if (Math.abs(s.cornerAngles[1] - angle) < 1e-3) {
                        shape = s;
                        startEdge = 1;
                    }
                    if (shape) break;
                }
                if (!shape) {
                    throw new Error("found no shape with the correct angle");
                }

                // store the shape for this intersection type
                return { shape, startEdge };
            }),
        );
    }

    gridLine(
        line: DeBruijnGridLine,
        xMin: number,
        xMax: number,
    ): { x1: number; y1: number; x2: number; y2: number } {
        const radius = xMax - xMin;
        const angle = this.angles[line.index]; // - 0.5 * Math.PI;
        const offsetX =
            (line.offset - this.sigma[line.index]) *
            Math.cos(0.5 * Math.PI + angle);
        const offsetY =
            (line.offset - this.sigma[line.index]) *
            Math.sin(0.5 * Math.PI + angle);
        return {
            x1: -radius * Math.cos(angle) + offsetX,
            y1: -radius * Math.sin(angle) + offsetY,
            x2: radius * Math.cos(angle) + offsetX,
            y2: radius * Math.sin(angle) + offsetY,
        };
    }

    intersection(lineA: DeBruijnGridLine, lineB: DeBruijnGridLine): Point {
        return {
            x:
                (Math.sin(this.angles[lineA.index] + 0.5 * Math.PI) *
                    (lineB.offset - this.sigma[lineB.index]) -
                    Math.sin(this.angles[lineB.index] + 0.5 * Math.PI) *
                        (lineA.offset - this.sigma[lineA.index])) *
                this.cscDiff[lineA.index][lineB.index],
            y:
                (Math.cos(this.angles[lineB.index] + 0.5 * Math.PI) *
                    (lineA.offset - this.sigma[lineA.index]) -
                    Math.cos(this.angles[lineA.index] + 0.5 * Math.PI) *
                        (lineB.offset - this.sigma[lineB.index])) *
                this.cscDiff[lineA.index][lineB.index],
        };
    }

    findNeighbors(cell: Penrose3SourcePoint, dir: number) {
        // four directions:
        //  0: lineA, up
        //  1: lineB, up
        //  2: lineA, down
        //  3: lineB, down
        const line = dir % 2 == 0 ? cell.lineA : cell.lineB;
        const other = dir % 2 == 0 ? cell.lineB : cell.lineA;
        const up = dir < 2;

        let bestDist: number | undefined;
        let best: { line: DeBruijnGridLine; intersection: Point } | undefined;

        // find intersections with this line
        for (let i = 0; i < this.dimensions; i++) {
            if (i == line.index) continue;

            // find the nearest integer intersection
            let integerOffset: number;
            if (i == other.index) {
                // we are at an intersection with this line
                // easy: move one step
                integerOffset = other.offset + (up ? 1 : -1);
            } else {
                // compute the continuous offset for this line
                const offsetFromX =
                    this.sigma[i] +
                    (cell.intersection.x * this.sinDiff[line.index][i] +
                        Math.sin(this.angles[i] + 0.5 * Math.PI) *
                            (line.offset - this.sigma[line.index])) /
                        Math.sin(this.angles[line.index] + 0.5 * Math.PI);

                // do we go up or down in offset?
                const angleDiff =
                    (this.angles[i] - this.angles[line.index] + 2 * Math.PI) %
                    (2 * Math.PI);
                if (up == angleDiff > Math.PI) {
                    // line i is to the left, we should move up on i to move up on our line
                    integerOffset = Math.ceil(offsetFromX);
                } else {
                    // line i is to the right, we should move down on i to move up on our line
                    integerOffset = Math.floor(offsetFromX);
                }
            }

            // find intersection
            const candidate = { index: i, offset: integerOffset };
            const intersection = this.intersection(line, candidate);

            // keep closest intersection in this direction
            const d = dist(cell.intersection, intersection);
            if (bestDist === undefined || bestDist > d) {
                bestDist = d;
                best = {
                    line: candidate,
                    intersection: intersection,
                };
            }
        }

        // keep closest neighbor
        const neighbor = this.getPoint(line, best!.line);
        return {
            point: neighbor,
            side:
                ((up ? 2 : 0) +
                    (line.index == neighbor.lineA.index ? 0 : 1) +
                    neighbor.startEdge) %
                4,
        };
    }
}

function computeKey(lineA: DeBruijnGridLine, lineB: DeBruijnGridLine): string {
    if (lineA.index > lineB.index) {
        const l = lineA;
        lineA = lineB;
        lineB = l;
    }
    return `${Math.round(lineA.index)} ${Math.round(lineA.offset)} ${Math.round(lineB.index)} ${Math.round(lineB.offset)}`;
}

class Penrose3SourcePoint extends SourcePoint {
    private grid: Penrose3SourceGrid;
    /**
     * The cell is located at this intersection point.
     */
    intersection: Point;
    /**
     * Crossing line with lowest index.
     */
    lineA: DeBruijnGridLine;
    /**
     * Crossing line with highest index.
     */
    lineB: DeBruijnGridLine;
    /**
     * Polygon shape offset: edge 0 of the cell has edge startEdge from the shape.
     */
    startEdge: number;

    constructor(
        grid: Penrose3SourceGrid,
        lineA: DeBruijnGridLine,
        lineB: DeBruijnGridLine,
    ) {
        const config = grid.shapeForLines[lineA.index][lineB.index]!;

        super(computeKey(lineA, lineB), config.shape);
        this.grid = grid;
        this.startEdge = config.startEdge;
        this.lineA = lineA.index < lineB.index ? lineA : lineB;
        this.lineB = lineA.index < lineB.index ? lineB : lineA;
        this.intersection = grid.intersection(lineA, lineB);
    }

    neighbor(side: number) {
        const dir = (side - this.startEdge + 4) % 4;
        return this.grid.findNeighbors(this, dir);
    }
}
