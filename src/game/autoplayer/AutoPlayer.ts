/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG, seedPRNG, selectRandom } from "../../geom/RandomSampler";
import { rotateArray } from "../../geom/arrays";
import { Shape } from "../../grid/Shape";
import { PlaceholderTile, TileColors } from "../../grid/Tile";
import { Game } from "../Game";

/**
 * An option for the next tile to play.
 */
type PlayOption = {
    /**
     * The slot index of the tile on the tile stack.
     */
    indexOnStack: number;
    /**
     * The shape of the tile.
     */
    shape: Shape;
    /**
     * The color sequence of the tile.
     */
    colors: TileColors;
    /**
     * The placeholder to replace the tile with.
     */
    placeholder: PlaceholderTile;
    /**
     * The rotation steps to be applied to the color sequence.
     */
    rotation: number;
};

/**
 * An AutoPlayer automatically plays a game by taking tiles from the tile
 * stack and placing them according to the selected strategy.
 */
export class AutoPlayer {
    /**
     * The game being played.
     */
    game: Game;
    /**
     * The tile placement strategy.
     */
    tileSelector: TileSelector;

    /**
     * Constructs a new AutoPlayer.
     * @param game the game to play
     * @param tileSelector the tile placement strategy, MaxNeighborTileSelector by default
     */
    constructor(game: Game, tileSelector?: TileSelector) {
        this.game = game;
        this.tileSelector = tileSelector || new MaxNeighborTileSelector();
    }

    /**
     * Places all tiles until the tile stack is empty, or the remaining visible
     * tiles cannot be placed in a valid position on the board.
     *
     * By default, all tiles are placed immediately.
     * Specify a delay to simulate a game being played in real-time.
     *
     * @param delay delay in milliseconds after each tile
     * @param prng the random number generator for the selection
     */
    playAllTiles(delay: number, prng?: PRNG): Promise<void>;
    playAllTiles(delay: undefined, prng?: PRNG): void;
    playAllTiles(delay?: number, prng?: PRNG): Promise<void> | void {
        if (delay) {
            return new Promise<void>((resolve, reject) => {
                const doPlay = () => {
                    if (this.playOneTile(prng)) {
                        setTimeout(doPlay, delay);
                    } else {
                        resolve();
                    }
                };
                doPlay();
            });
        } else {
            while (this.playOneTile(prng));
        }
    }

    /**
     * Take one tile from the tile stack and place it on the board.
     * @param prng the random number generator for the selection
     * @returns true if a tile was successfully placed, false otherwise
     */
    playOneTile(prng?: PRNG): boolean {
        const option = this.suggestOneTile(prng);
        if (!option) return false;
        return this.game.placeColors(
            rotateArray(option.colors, option.rotation),
            option.placeholder,
            option.indexOnStack,
        );
    }

    /**
     * Suggest the next tile to place.
     * @param prng the random number generator for the selection
     * @returns the suggested tile placement, or null if no valid option is found
     */
    suggestOneTile(prng?: PRNG): PlayOption | null {
        if (!prng) prng = seedPRNG();
        const grid = this.game.grid;
        const tileStack = this.game.tileStack;

        // find all possibilities for the available tiles
        const options: PlayOption[] = [];
        for (let idx = 0; idx < tileStack.slots.length; idx++) {
            const slot = this.game.tileStack.slots[idx];
            if (!slot) continue;

            // find valid locations and rotations
            for (const placeholder of grid.placeholders) {
                if (slot.shape === placeholder.shape) {
                    const rotations = grid.checkColorsWithRotation(
                        placeholder,
                        slot.colors,
                    );
                    for (const rotation of rotations) {
                        options.push({
                            indexOnStack: idx,
                            shape: slot.shape,
                            colors: slot.colors,
                            placeholder: placeholder,
                            rotation: rotation,
                        });
                    }
                }
            }
        }

        // pick a random option
        const option = this.tileSelector.selectNextOption(options, prng)!;
        return option || null;
    }
}

/**
 * A tile selection strategy for the AutoPlayer.
 */
interface TileSelector {
    /**
     * Selects the next option to be played.
     * @param options the list of possible next plays
     * @param prng the random number generator for the selection
     * @returns the next option
     */
    selectNextOption(options: PlayOption[], prng: PRNG): PlayOption | undefined;
}

/**
 * Pick a random option from the list of possible next plays.
 */
export class RandomTileSelector implements TileSelector {
    selectNextOption(
        options: PlayOption[],
        prng: PRNG,
    ): PlayOption | undefined {
        return selectRandom(options, prng());
    }
}

/**
 * Pick the option that would connect the maximum number of neighbors
 * to the new tile. Returns a random tile if there are multiple options.
 */
export class MaxNeighborTileSelector implements TileSelector {
    selectNextOption(
        options: PlayOption[],
        prng: PRNG,
    ): PlayOption | undefined {
        let maxNeighbors = 0;
        let bestOptions: PlayOption[] = [];
        for (const option of options) {
            const neighbors = option.placeholder.neighbors.size;
            if (neighbors > maxNeighbors) {
                bestOptions = [option];
                maxNeighbors = neighbors;
            } else if (neighbors == maxNeighbors) {
                bestOptions.push(option);
            }
        }
        return selectRandom(bestOptions, prng());
    }
}
