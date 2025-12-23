/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { TileColors } from "../grid/Tile";
import { Shape } from "../grid/Shape";
import { PRNG, shuffle } from "../geom/RandomSampler";
import * as zod from "zod/v4-mini";

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

export const TileShapeColors_S = zod.object({
    shape: zod.int(),
    colors: zod.readonly(zod.array(zod.string())),
});
export type TileShapeColors_S = zod.infer<typeof TileShapeColors_S>;

export const TileStack_S = zod.readonly(zod.array(TileShapeColors_S));
export type TileStack_S = zod.infer<typeof TileStack_S>;

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
     * @param prng the random number generator to use, or false to disable shuffling
     */
    constructor(tileSet: TileShapeColors[], prng?: PRNG | false) {
        this.tiles = [...tileSet];
        if (prng !== false) {
            shuffle(this.tiles, prng);
        }
    }

    /**
     * Serializes the tile stack.
     *
     * @param shapeMap the sequence of shapes to map shapes to indices
     * @returns the serialized tiles
     */
    save(shapeMap: readonly Shape[]): TileStack_S {
        return this.tiles.map((t) => saveTileShapeColors(t, shapeMap));
    }

    /**
     * Restores a serialized tile stack.
     *
     * @param shapeMap the sequence of shapes to map indices to shapes
     * @returns the restored tile stack
     */
    static restore(data: unknown, shapeMap: readonly Shape[]): TileStack {
        return new TileStack(
            TileStack_S.parse(data).map((d) =>
                restoreTileShapeColors(d, shapeMap),
            ),
            false,
        );
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
     * Removes the next tile from the end of stack.
     * @returns the tile, or undefined if the stack was empty
     */
    pop(): TileShapeColors | undefined {
        return this.tiles.length == 0 ? undefined : this.tiles.pop();
    }

    /**
     * Removes the next tile from the front of the stack.
     * @returns the tile, or undefined if the stack was empty
     */
    shift(): TileShapeColors | undefined {
        return this.tiles.length == 0 ? undefined : this.tiles.shift();
    }

    /**
     * Adds a new tile to the end of the stack.
     * @param tile the new tile to add
     */
    push(tile: TileShapeColors) {
        this.tiles.push(tile);
    }

    /**
     * Adds a new tile to the front of the stack.
     * @param tile the new tile to add
     */
    unshift(tile: TileShapeColors) {
        this.tiles.unshift(tile);
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
     * @param prng random number generator
     * @returns the new tilestack
     */
    clone(prng?: PRNG) {
        return new TileStack([...this.tiles], prng);
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

export function saveTileShapeColors(
    tile: TileShapeColors,
    shapeMap: readonly Shape[],
): TileShapeColors_S {
    return {
        shape: shapeMap.indexOf(tile.shape),
        colors: tile.colors,
    };
}

export function restoreTileShapeColors(
    tile: TileShapeColors_S,
    shapeMap: readonly Shape[],
): TileShapeColors {
    return {
        shape: shapeMap[tile.shape],
        colors: tile.colors,
    };
}
