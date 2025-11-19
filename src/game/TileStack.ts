/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { TileColors } from "../grid/Tile";
import { Shape } from "../grid/Shape";
import { PRNG, shuffle } from "../geom/RandomSampler";

/**
 * A tile on the TileStack, defined by a shape and colors.
 */
export type TileShapeColors = {
    /**
     * The tile shape.
     */
    shape: Shape;
    /**
     * The colors of the tile segments.
     */
    colors: TileColors;
};

/**
 * A TileStack representing the tiles available during the game.
 * Tiles are removed and added during the game.
 */
export class TileStack {
    /**
     * The list of tiles on the stack.
     */
    tiles: TileShapeColors[];

    /**
     * Constructs a new TileStack from the given set of tiles.
     *
     * The given list of tiles is copied and shuffled before it is
     * added to the stack.
     *
     * @param tileSet the initial set of tiles
     * @param prng the random number generator to use
     */
    constructor(tileSet: TileShapeColors[], prng?: PRNG) {
        this.tiles = [...tileSet];
        shuffle(this.tiles, prng);
    }

    /**
     * Returns the next n tiles on the stack.
     * @param n the number of tiles to return
     * @returns the first n tiles
     */
    peek(n: number): TileShapeColors[] {
        return this.tiles.slice(0, n);
    }

    /**
     * Removes the next tile from the stack.
     * @returns the tile, or undefined if the stack was empty
     */
    pop(): TileShapeColors | undefined {
        if (this.tiles.length == 0) {
            return undefined;
        }
        return this.tiles.shift();
    }

    /**
     * Adds a new tile to the end of the stack.
     * @param tile the new tile to add
     */
    push(tile: TileShapeColors) {
        this.tiles.push(tile);
    }

    /**
     * Shuffles the tiles on the stack.
     * @param prng the random number generator to use
     */
    shuffle(prng?: PRNG) {
        shuffle(this.tiles, prng);
    }

    /**
     * Removes the tile at the given index.
     * @param idx the index of the tile
     */
    removeWithIndex(idx: number): void {
        if (idx < this.tiles.length) {
            this.tiles.splice(idx, 1);
        }
    }

    /**
     * Removes the tile with the given colors from the stack.
     *
     * If the stack contains multiple tiles with these
     * (rotation-invariant) colors, only the first tile is removed.
     *
     * @param slot the color sequence to be removed
     * @returns true if the tile was found, false otherwise
     */
    removeColors(slot: TileShapeColors): boolean {
        for (let i = 0; i < this.tiles.length; i++) {
            if (tileColorsEqualWithRotation(this.tiles[i], slot)) {
                this.removeWithIndex(i);
                return true;
            }
        }
        return false;
    }

    /**
     * The number of tiles left on the stack.
     */
    get tilesLeft(): number {
        return this.tiles.length;
    }

    /**
     * Checks if the stack is empty.
     * @returns true if no tiles are left
     */
    isEmpty() {
        return this.tiles.length == 0;
    }

    /**
     * Creates a clone of the current tile stack.
     * @returns the new tilestack
     */
    clone() {
        return new TileStack([...this.tiles]);
    }
}

/**
 * Checks if two color sequences are the same, after rotation.
 *
 * TODO: This considers any rotation valid and ignores shape-specific rotation variants.
 *
 * @param a sequence a
 * @param b sequence b
 * @returns true if the two sequences can be rotated to be the same
 */
export function tileColorsEqualWithRotation(
    a: TileShapeColors,
    b: TileShapeColors,
): boolean {
    if (a.shape !== b.shape) return false;
    if (a.colors.length != b.colors.length) return false;
    for (let i = 0; i < a.colors.length; i++) {
        let ok = true;
        for (let j = 0; j < b.colors.length && ok; j++) {
            if (a.colors[j] != b.colors[(i + j) % b.colors.length]) ok = false;
        }
        if (ok) return true;
    }
    return false;
}
