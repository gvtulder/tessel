/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { orientedArea, Point } from "../../geom/math";
import { Grid } from "../../grid/Grid";
import { Tile } from "../../grid/Tile";
import { Scorer, ScoredRegion } from "./Scorer";
import { msg } from "@lingui/core/macro";

export class HoleScorer extends Scorer {
    static friendlyName = msg({
        id: "scorer.HoleScorer.friendlyName",
        message: "Count holes",
    });

    static create() {
        return new HoleScorer();
    }

    holesScored: Map<Point, readonly Point[]>;
    previousRingCount: number;

    constructor() {
        super();
        this.holesScored = new Map<Point, readonly Point[]>();
        this.previousRingCount = 0;
    }

    computeScores(
        grid: Grid,
        tile: Tile,
        includeIncomplete?: boolean,
    ): ScoredRegion[] {
        const rings = grid.rings.rings;

        const shapes: ScoredRegion[] = [];

        for (const ring of rings) {
            if (!isHole(ring)) continue;
            const previous = this.holesScored.get(ring[0]);
            if (previous && previous.length === ring.length) {
                // same ring already scored
                continue;
            }
            if (previous) {
                // ring changed
                for (const point of previous) {
                    this.holesScored.delete(point);
                }
            }

            for (const point of ring) {
                this.holesScored.set(point, ring);
            }

            if (this.previousRingCount === rings.length) {
                // no new rings
                continue;
            }

            const shape: ScoredRegion = {
                boundary: ring,
                finished: true,
                points: 1,
                pointsAreVariable: false,
            };
            shapes.push(shape);
        }

        this.previousRingCount = rings.length;

        return shapes;
    }
}

function isHole(ring: readonly Point[]): boolean {
    const area = orientedArea(ring);
    return area < 0;
}
