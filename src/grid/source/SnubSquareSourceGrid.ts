/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG } from "../../geom/RandomSampler";
import { parseShapeDefinition } from "../Atlas";
import { Shape } from "../Shape";
import { SourceGrid, SourcePoint } from "../SourceGrid";
import * as zod from "zod";

const square = parseShapeDefinition({
    name: "square",
    angles: [90, 90, 90, 90],
    frequency: 1,
    colorPatterns: [
        [[0, 1, 2, 3]],
        [
            [0, 0, 1, 1],
            [0, 1, 1, 0],
        ],
        [[0, 0, 0, 0]],
    ],
    preferredAngles: {
        setupAtlas: 315,
        mainMenu: 315,
    },
});

const triangle = parseShapeDefinition({
    name: "triangle",
    angles: [60, 60, 60],
    frequency: 2,
    colorPatterns: [
        [[0, 1, 2]],
        [
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0],
        ],
        [[0, 0, 0]],
    ],
    preferredAngles: {
        stackDisplay: 180,
    },
});

function xyzToKey(x: number, y: number, z: number) {
    return `${x} ${y} ${z}`;
}

//
// Snub-Square numbering scheme:
//
// First numbering squares and triangle-pairs:
//   x:  column
//   y:  row
// Dividing rhombuses in triangles:
//   z:  0 for left (bottom-left or top-left)
//       1 for right (top-right or bottom-right)
//

export class SnubSquareSourceGrid extends SourceGrid {
    static readonly shapes = [square, triangle] as readonly Shape[];
    static readonly shapeFrequencies = new Map([
        [square, 1],
        [triangle, 2],
    ]) as ReadonlyMap<Shape, number>;

    static create(prng?: PRNG) {
        return new SnubSquareSourceGrid(prng);
    }

    save() {
        return {};
    }

    static restore(data: unknown): SnubSquareSourceGrid {
        return new SnubSquareSourceGrid();
    }

    restorePoint(data: unknown): SourcePoint {
        const p = SnubSquareSourcePoint_S.parse(data);
        return this.getPoint(p.x, p.y, p.z);
    }

    getOrigin(): SourcePoint {
        return this.getPoint(0, 0, 0);
    }

    getPoint(x: number, y: number, z: number): SourcePoint {
        const key = xyzToKey(x, y, z);
        let point = this.points.get(key);
        if (!point) {
            point = new SnubSquareSourcePoint(this, x, y, z);
            this.points.set(key, point);
        }
        return point;
    }
}

const SnubSquareSourcePoint_S = zod.object({
    x: zod.number(),
    y: zod.number(),
    z: zod.number(),
});
type SnubSquareSourcePoint_S = zod.infer<typeof SnubSquareSourcePoint_S>;

class SnubSquareSourcePoint extends SourcePoint {
    private grid: SnubSquareSourceGrid;
    private readonly x: number;
    private readonly y: number;
    private readonly z: number;

    constructor(grid: SnubSquareSourceGrid, x: number, y: number, z: number) {
        const xEven = ((x % 2) + 2) % 2 == 0;
        const yEven = ((y % 2) + 2) % 2 == 0;
        const shape = xEven == yEven ? square : triangle;

        super(xyzToKey(x, y, z), shape);
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    save(): SnubSquareSourcePoint_S {
        return { x: this.x, y: this.y, z: this.z };
    }

    neighbor(side: number) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const xMod = ((x % 2) + 2) % 2;
        const yMod = ((y % 2) + 2) % 2;
        // linking [x, y, z] to the new [x, y, z]
        const links = [
            // squares
            [
                [0, 0, 0],
                [
                    [x - 1, y, 1, 1],
                    [x, y - 1, 0, 2],
                    [x + 1, y, 0, 0],
                    [x, y + 1, 1, 1],
                ],
            ],
            [
                [1, 1, 0],
                [
                    [x - 1, y, 1, 2],
                    [x, y - 1, 1, 2],
                    [x + 1, y, 0, 0],
                    [x, y + 1, 0, 1],
                ],
            ],
            // triangles
            [
                [1, 0, 0],
                [
                    [x - 1, y, 0, 2],
                    [x, y - 1, 0, 3],
                    [x, y, 1, 0],
                ],
            ],
            [
                [1, 0, 1],
                [
                    [x, y, 0, 2],
                    [x + 1, y, 0, 0],
                    [x, y + 1, 0, 1],
                ],
            ],
            [
                [0, 1, 0],
                [
                    [x - 1, y, 0, 2],
                    [x, y, 1, 0],
                    [x, y + 1, 0, 1],
                ],
            ],
            [
                [0, 1, 1],
                [
                    [x, y, 0, 1],
                    [x, y - 1, 0, 3],
                    [x + 1, y, 0, 0],
                ],
            ],
        ] as [[number, number, number], [number, number, number, number][]][];
        let nX: number;
        let nY: number;
        let nZ: number;
        let nSide: number;
        let found = false;
        for (const [source, neighbors] of links) {
            if (source[0] == xMod && source[1] == yMod && source[2] == z) {
                nX = neighbors[side][0];
                nY = neighbors[side][1];
                nZ = neighbors[side][2];
                nSide = neighbors[side][3];
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error("invalid coordinates");
        }
        return { point: this.grid.getPoint(nX!, nY!, nZ!), side: nSide! };
    }
}
