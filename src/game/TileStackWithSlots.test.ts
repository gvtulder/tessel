/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { seedPRNG } from "../geom/RandomSampler";
import { SquaresAtlas } from "../grid/atlas/SquaresAtlas";
import { TileStackWithSlots } from "./TileStackWithSlots";
import { TileStack } from "./TileStack";

describe("TileStackWithSlots", () => {
    const square = SquaresAtlas.shapes[0];
    const list = [
        { shape: square, colors: ["A", "B", "C", "D"] },
        { shape: square, colors: ["A", "A", "B", "B"] },
        { shape: square, colors: ["B", "A", "B", "B"] },
        { shape: square, colors: ["B", "A", "B", "A"] },
        { shape: square, colors: ["B", "A", "B", "C"] },
    ];

    test("basic functionality", () => {
        const source = new TileStack(list);
        const stack = new TileStackWithSlots(source, 3);
        expect(stack.tilesLeft).toBe(5);
        expect(stack.tilesVisible).toBe(3);
        expect(stack.tilesOnStack).toBe(2);

        const visible0 = stack.slots[0];
        const visible1 = stack.slots[1];
        const visible2 = stack.slots[2];
        stack.take(1);
        expect(stack.slots[0]).toBe(visible0);
        expect(stack.slots[1]).not.toBe(visible1);
        expect(stack.slots[2]).toBe(visible2);
        expect(stack.tilesLeft).toBe(4);
        expect(stack.tilesVisible).toBe(3);
        expect(stack.tilesOnStack).toBe(1);
        expect(stack.isEmpty()).toBe(false);
        stack.take(0);
        expect(stack.slots[0]).not.toBe(visible0);
        expect(stack.slots[2]).toBe(visible2);
        expect(stack.tilesLeft).toBe(3);
        expect(stack.tilesVisible).toBe(3);
        expect(stack.tilesOnStack).toBe(0);
        stack.take(0);
        expect(stack.slots[0]).toBeFalsy();
        expect(stack.tilesLeft).toBe(2);
        expect(stack.tilesVisible).toBe(2);
        expect(stack.tilesOnStack).toBe(0);
        stack.take(0);
        expect(stack.tilesLeft).toBe(2);
        expect(stack.tilesVisible).toBe(2);
        expect(stack.tilesOnStack).toBe(0);
        stack.take(1);
        stack.take(2);
        expect(stack.tilesLeft).toBe(0);
        expect(stack.tilesVisible).toBe(0);
        expect(stack.tilesOnStack).toBe(0);
        expect(stack.isEmpty()).toBe(true);
    });

    test("reshuffle", () => {
        const prng = seedPRNG(1234);
        const source = new TileStack(list);
        const stack = new TileStackWithSlots(source, 3);
        const slot0 = stack.slots[0];
        stack.reshuffle(prng);
        expect(stack.tilesLeft).toBe(5);
        expect(stack.slots[0]).not.toEqual(slot0);
    });

    test("rotate", () => {
        const prng = seedPRNG(1234);
        const source = new TileStack(list, prng);
        const stack = new TileStackWithSlots(source, 3, prng);
        const slot0 = stack.slots[0];
        const slot1 = stack.slots[1];
        const slot2 = stack.slots[2];
        const peek = stack.tileStack.peek(2);
        stack.rotate();
        expect(stack.tilesLeft).toBe(5);
        expect(stack.slots[0]).toEqual(peek[0]);
        expect(stack.slots[1]).toEqual(peek[1]);
        expect(stack.slots[2]).toEqual(slot0);
        expect(stack.tileStack.peek(2)).toEqual([slot1, slot2]);
        stack.rotate(true);
        expect(stack.tilesLeft).toBe(5);
        expect(stack.slots[0]).toEqual(slot0);
        expect(stack.slots[1]).toEqual(slot1);
        expect(stack.slots[2]).toEqual(slot2);
        expect(stack.tileStack.peek(2)).toEqual(peek);
    });

    test("restart", () => {
        const source = new TileStack(list);
        const stack = new TileStackWithSlots(source, 3);
        expect(stack.tilesLeft).toBe(5);
        const t0 = stack.take(0);
        const t1 = stack.take(0);
        const t2 = stack.take(0);
        stack.restart();
        expect(stack.tilesLeft).toBe(5);
    });

    test("removeColors", () => {
        const source = new TileStack(list);
        const stack = new TileStackWithSlots(source, 3);
        expect(stack.removeColors(stack.slots[0]!)).toBe(true);
        expect(stack.tilesLeft).toBe(4);
        expect(stack.tilesVisible).toBe(3);
        expect(stack.removeColors(stack.tileStack.tiles[0])).toBe(true);
        expect(stack.tilesLeft).toBe(3);
        expect(stack.tilesVisible).toBe(3);
    });

    test("can be saved", () => {
        const shapeMap = [square];
        const source = new TileStack(list);
        const stack = new TileStackWithSlots(source, 3);
        const saved = stack.save(shapeMap);
        const restored = TileStackWithSlots.restore(saved, shapeMap);
        expect(restored).toStrictEqual(stack);
    });
});
