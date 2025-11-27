/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG } from "../geom/RandomSampler";
import { GameEvent, GameEventType } from "./Game";
import {
    TileShapeColors,
    TileStack,
    tileColorsEqualWithRotation,
} from "./TileStack";
import { Shape } from "../grid/Shape";
import { TileStackWithSlots_S } from "./TileStackWithSlots_S";

/**
 * A tile stack with a number of tiles shown to the player.
 *
 * This stack contains a number of slots containing the tiles currently
 * available to the player, and a list of tiles that will become
 * available when one of the visible tiles is played.
 *
 * Generates UpdateTileCount and UpdateSlots events when the number of
 * tiles on the stack or the contents of the tile slots change.
 */
export class TileStackWithSlots extends EventTarget {
    /**
     * The maximum number of tiles to be visible.
     */
    numberShown: number;
    /**
     * The slots with currently visible tiles.
     */
    slots: (TileShapeColors | null | undefined)[];
    /**
     * The tiles that will become available next.
     */
    tileStack: TileStack;
    /**
     * A copy of the original stack to be used by the restart function.
     */
    originalTileStack: TileStack;

    /**
     * Constructs a new tile stack.
     *
     * @param tileStack the stack of tiles
     * @param numberShown the number of tiles to show simultaneously
     * @param prng random number generator
     */
    constructor(tileStack: TileStack, numberShown: number, prng?: PRNG) {
        super();
        this.originalTileStack = tileStack;
        this.tileStack = tileStack.clone(prng);
        this.numberShown = numberShown;
        this.slots = [];
        this.updateSlots();
    }

    /**
     * Serializes the tile stack.
     *
     * @param shapeMap the sequence of shapes to map shapes to indices
     * @returns the serialized tiles
     */
    save(shapeMap: readonly Shape[]): TileStackWithSlots_S {
        return {
            numberShown: this.numberShown,
            slots: this.slots.map((slot) =>
                slot
                    ? {
                          shape: shapeMap.indexOf(slot.shape),
                          colors: slot?.colors,
                      }
                    : undefined,
            ),
            originalTileStack: this.originalTileStack.save(shapeMap),
            tileStack: this.tileStack.save(shapeMap),
        };
    }

    /**
     * Restores a serialized tile stack.
     *
     * @param shapeMap the sequence of shapes to map indices to shapes
     * @returns the restored tile stack
     */
    static restore(
        data: unknown,
        shapeMap: readonly Shape[],
    ): TileStackWithSlots {
        const d = TileStackWithSlots_S.parse(data);
        const stack = new TileStackWithSlots(
            TileStack.restore(d.originalTileStack, shapeMap),
            d.numberShown,
        );
        // restore state
        stack.tileStack = TileStack.restore(d.tileStack, shapeMap);
        stack.slots = d.slots.map((slot) =>
            slot
                ? {
                      shape: shapeMap[slot.shape],
                      colors: slot.colors,
                  }
                : undefined,
        );
        return stack;
    }

    /**
     * Updates the tile slots.
     *
     * Re-fills empty slots if there are more tiles left on the stack
     * and fires UpdateTileCount and UpdateSlots events if anything changed.
     */
    updateSlots() {
        let updated = false;
        for (let i = 0; i < this.numberShown; i++) {
            if (!this.slots[i]) {
                this.slots[i] = this.tileStack.pop();
                updated = true;
            }
        }
        if (updated) {
            this.dispatchEvent(new GameEvent(GameEventType.UpdateTileCount));
            this.dispatchEvent(new GameEvent(GameEventType.UpdateSlots));
        }
    }

    /**
     * Remove the tile from the given slot and refill the slot if possible.
     *
     * @param index the index of the slot
     */
    take(index: number) {
        this.slots[index] = null;
        this.updateSlots();
    }

    /**
     * Shuffles the tile stack and displays new tiles.
     */
    reshuffle(prng?: PRNG) {
        for (let i = 0; i < this.numberShown; i++) {
            const slot = this.slots[i];
            if (slot) {
                this.tileStack.push(slot);
                this.slots[i] = null;
            }
        }
        this.tileStack.shuffle(prng);
        this.updateSlots();
    }

    /**
     * Restarts the game by adding the original list of tiles again.
     * @param prng random number generator
     */
    restart(prng?: PRNG) {
        for (let i = 0; i < this.numberShown; i++) {
            this.slots[i] = null;
        }
        this.tileStack = this.originalTileStack.clone(prng);
        this.updateSlots();
    }

    /**
     * Removes the tile with the given color sequence from the stack or slots.
     *
     * @param slot the color sequence
     * @returns true if a tile was found and removed
     */
    removeColors(slot: TileShapeColors): boolean {
        for (let i = 0; i < this.numberShown; i++) {
            if (
                this.slots[i] &&
                tileColorsEqualWithRotation(this.slots[i]!, slot)
            ) {
                this.slots[i] = null;
                this.updateSlots();
                return true;
            }
        }
        return this.tileStack.removeColors(slot);
    }

    /**
     * The number of filled slots.
     */
    get tilesVisible(): number {
        let n = 0;
        for (const slot of this.slots) {
            if (slot) n++;
        }
        return n;
    }

    /**
     * The number of tiles on the stack (excluding visible tiles).
     */
    get tilesOnStack(): number {
        return this.tileStack.tilesLeft;
    }

    /**
     * The number of tiles left on the stack plus the number of filled slots.
     */
    get tilesLeft(): number {
        return this.tileStack.tilesLeft + this.tilesVisible;
    }

    /**
     * Checks if the stack and slots are empty.
     * @returns true if there are no tiles left
     */
    isEmpty() {
        for (const slot of this.slots) {
            if (slot) return false;
        }
        return this.tileStack.isEmpty();
    }
}
