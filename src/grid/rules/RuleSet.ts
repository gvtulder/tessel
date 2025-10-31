/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { Tile, TileColors, TileSegment } from "../Tile";

export type RuleSetType = typeof RuleSet;

/**
 * A RuleSet can check if the new colors would fit on the given tile.
 */
export abstract class RuleSet {
    /**
     * A unique identifier for this ruleset.
     */
    static id: string;

    /**
     * A user-friendly name for this ruleset.
     */
    static friendlyName: MessageDescriptor;

    /**
     * Create a new RuleSet instance.
     */
    static create(): RuleSet {
        throw new Error("should be implemented in subclass");
    }

    /**
     * Checks if the colors would fit on this tile.
     * @param tile a tile on the grid
     * @param colors the new color sequence
     * @param offset the offset of the colors in the tile
     */
    abstract checkColors(
        tile: Tile,
        colors: TileColors,
        offset?: number,
    ): boolean;

    /**
     * Returns the color constraints for the tile segment,
     * listing the tile segments that should have the same color
     * and those that should have a different color.
     */
    abstract computeColorConstraints(tileSegment: TileSegment): {
        same: TileSegment[];
        different: TileSegment[];
    };

    /**
     * A unique identifier for this ruleset type.
     */
    get id(): string {
        return (this.constructor as typeof RuleSet).id;
    }
}
