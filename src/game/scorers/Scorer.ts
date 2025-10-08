/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Point } from "../../geom/math";
import { Grid } from "../../grid/Grid";
import { Tile, TileColor, TileSegment } from "../../grid/Tile";

export type ScoredRegion = {
    origin?: TileSegment;
    color?: TileColor;
    tiles?: Set<Tile>;
    segments?: Set<TileSegment>;
    boundary: readonly Point[];
    finished: boolean;
    points: number;
    pointsAreVariable: boolean;
};

export type ScorerType = typeof Scorer;

export abstract class Scorer {
    /**
     * A friendly name for the scorer.
     */
    static friendlyName: string;

    /**
     * Create a new Scorer instance.
     */
    static create(): Scorer {
        throw new Error("should be implemented in subclass");
    }

    /**
     * Computes the score after placing the given tile.
     *
     * @param grid the grid
     * @param tile the last tile played
     * @param includeIncomplete return incomplete regions?
     * @returns the regions found from the tile
     */
    abstract computeScores(
        grid: Grid,
        tile: Tile,
        includeIncomplete?: boolean,
    ): ScoredRegion[];
}
