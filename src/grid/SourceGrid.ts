/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG } from "../geom/RandomSampler";
import { Shape } from "./Shape";

export type SourceGridType = typeof SourceGrid;

export abstract class SourceGrid {
    static readonly shapes: readonly Shape[];
    static readonly shapeFrequencies: ReadonlyMap<Shape, number>;

    static restore: (data: unknown) => SourceGrid;

    static create(prng?: PRNG): SourceGrid {
        throw new Error("Must be implemented in a subclass.");
    }

    protected readonly prng: PRNG;
    protected readonly points: Map<string, SourcePoint>;

    constructor(prng: PRNG = Math.random) {
        this.prng = prng;
        this.points = new Map<string, SourcePoint>();
    }

    abstract getOrigin(): SourcePoint;

    abstract save(): unknown;
    abstract restorePoint(d: unknown): SourcePoint;
}

type SourcePointSide = {
    point: SourcePoint;
    side: number;
};

export abstract class SourcePoint {
    readonly key: string;
    readonly shape: Shape;
    readonly numSides: number;

    constructor(key: string, shape: Shape) {
        this.key = key;
        this.shape = shape;
        this.numSides = shape.cornerAngles.length;
    }

    abstract neighbor(side: number): SourcePointSide;

    abstract save(): unknown;
}
