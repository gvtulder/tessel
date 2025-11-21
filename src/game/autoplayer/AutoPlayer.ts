/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG, seedPRNG, selectRandom } from "../../geom/RandomSampler";
import { rotateArray } from "../../geom/arrays";
import { Shape } from "../../grid/Shape";
import { PlaceholderTile, TileColors } from "../../grid/Tile";
import { Game } from "../Game";

type PlayOption = {
    indexOnStack: number;
    shape: Shape;
    colors: TileColors;
    placeholder: PlaceholderTile;
    rotation: number;
};

export class AutoPlayer {
    game: Game;
    tileSelector: TileSelector;

    constructor(game: Game, tileSelector?: TileSelector) {
        this.game = game;
        this.tileSelector = tileSelector || new RandomTileSelector();
        this.tileSelector = new MaxNeighborTileSelector();
    }

    playAllTiles(delay?: number, prng?: PRNG) {
        if (delay) {
            const doPlay = () => {
                if (this.playOneTile(prng)) {
                    setTimeout(doPlay, delay);
                }
            };
            doPlay();
        } else {
            while (this.playOneTile(prng));
        }
    }

    playOneTile(prng?: PRNG) {
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
        if (!option) return false;
        return this.game.placeColors(
            rotateArray(option.colors, option.rotation),
            option.placeholder,
            option.indexOnStack,
        );
    }
}

interface TileSelector {
    selectNextOption(options: PlayOption[], prng: PRNG): PlayOption | undefined;
}

class RandomTileSelector implements TileSelector {
    selectNextOption(
        options: PlayOption[],
        prng: PRNG,
    ): PlayOption | undefined {
        return selectRandom(options, prng());
    }
}

class MaxNeighborTileSelector implements TileSelector {
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
