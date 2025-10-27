/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { Tile, TileColors, TileSegment } from "../Tile";

/**
 * A RuleSet can check if the new colors would fit on the given tile.
 */
export interface RuleSet {
    /**
     * A user-friendly name for this ruleset.
     */
    name: MessageDescriptor;

    /**
     * Checks if the colors would fit on this tile.
     * @param tile a tile on the grid
     * @param colors the new color sequence
     * @param offset the offset of the colors in the tile
     */
    checkColors(tile: Tile, colors: TileColors, offset?: number): boolean;

    /**
     * Returns the color constraints for the tile segment,
     * listing the tile segments that should have the same color
     * and those that should have a different color.
     */
    computeColorConstraints(tileSegment: TileSegment): {
        same: TileSegment[];
        different: TileSegment[];
    };
}
