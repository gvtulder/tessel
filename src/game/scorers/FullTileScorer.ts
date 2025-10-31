/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "../../grid/Grid";
import { Tile, TileSegment } from "../../grid/Tile";
import { Scorer, ScoredRegion } from "./Scorer";
import { msg } from "@lingui/core/macro";

export class FullTileScorer extends Scorer {
    static id = "single-tile";

    static friendlyName = msg({
        id: "scorer.FullTileScorer.friendlyName",
        message: "Count tiles",
    });

    static create() {
        return new FullTileScorer();
    }

    computeScores(
        grid: Grid,
        tile: Tile,
        includeIncomplete?: boolean,
    ): ScoredRegion[] {
        const visited = new Set<TileSegment>();

        const shapes: ScoredRegion[] = [];

        if (!tile.segments) {
            throw new Error("tile has no segments");
        }

        const edges = [];
        for (let i = 0; i < tile.segments.length; i++) {
            edges.push({
                from: tile.segments[i],
                to: tile.segments[(i + 1) % tile.segments.length],
            });
        }

        const shape: ScoredRegion = {
            origin: tile.segments[0],
            color: tile.segments[0].color!,
            tiles: new Set<Tile>([tile]),
            segments: new Set<TileSegment>(tile.segments),
            boundary: tile.polygon.vertices,
            finished: true,
            points: 1,
            pointsAreVariable: false,
        };
        shapes.push(shape);

        return shapes;
    }
}
