/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { seedPRNG } from "../geom/RandomSampler";
import { tileColorsEqualWithRotation, TileStack } from "./TileStack";
import { SquaresAtlas } from "../grid/atlas/SquaresAtlas";
import { TrianglesAtlas } from "../grid/atlas/TrianglesAtlas";

describe("TileStack", () => {
    const square = SquaresAtlas.shapes[0];
    const list = [
        { shape: square, colors: ["A", "B", "C", "D"] },
        { shape: square, colors: ["A", "A", "B", "B"] },
        { shape: square, colors: ["B", "A", "B", "B"] },
        { shape: square, colors: ["B", "A", "B", "A"] },
    ];

    test("can be created and manipulated", () => {
        const stack = new TileStack(list);
        expect(stack.tilesLeft).toBe(list.length);
        const shuffled = [...stack.tiles];
        expect(stack.peek(2)).toEqual([shuffled[0], shuffled[1]]);
        expect(stack.pop()).toEqual(shuffled[0]);
        expect(stack.tilesLeft).toBe(3);
        expect(stack.isEmpty()).toBe(false);
        expect(stack.pop()).toEqual(shuffled[1]);
        expect(stack.pop()).toEqual(shuffled[2]);
        expect(stack.pop()).toEqual(shuffled[3]);
        expect(stack.tilesLeft).toBe(0);
        expect(stack.isEmpty()).toBe(true);
        expect(stack.pop()).toBeUndefined();
    });

    test("can push new slides", () => {
        const stack = new TileStack(list);
        expect(stack.tilesLeft).toBe(4);
        stack.push(list[0]);
        expect(stack.tilesLeft).toBe(5);
        expect(stack.tiles[4]).toBe(list[0]);
    });

    test("can be shuffled", () => {
        const prng = seedPRNG(1234);
        const stack = new TileStack(list, prng);
        const tile0 = stack.tiles[0];
        expect(stack.tilesLeft).toBe(4);
        stack.shuffle(prng);
        expect(stack.tilesLeft).toBe(4);
        expect(stack.tiles[0]).not.toBe(tile0);
    });

    test("removeWithIndex", () => {
        const stack = new TileStack(list);
        const expected = [stack.tiles[0], stack.tiles[1], stack.tiles[3]];
        stack.removeWithIndex(2);
        expect(stack.tilesLeft).toBe(3);
        expect(stack.tiles).toStrictEqual(expected);
        stack.removeWithIndex(3);
        expect(stack.tilesLeft).toBe(3);
    });

    test("removeColors", () => {
        const stack = new TileStack(list);
        const tile = stack.tiles[2];
        const expected = [stack.tiles[0], stack.tiles[1], stack.tiles[3]];
        stack.removeColors(tile);
        expect(stack.tilesLeft).toBe(3);
        expect(stack.tiles).toStrictEqual(expected);
    });

    test("clone", () => {
        const stack = new TileStack(list);
        const stack2 = stack.clone();
        stack.pop();
        expect(stack.tilesLeft).toBe(3);
        expect(stack2.tilesLeft).toBe(4);
        stack2.pop();
        expect(stack.tilesLeft).toBe(3);
        expect(stack2.tilesLeft).toBe(3);
    });
});

describe("tileColorsEqualWithRotation", () => {
    test("compares colors", () => {
        const square = SquaresAtlas.shapes[0];
        const triangle = TrianglesAtlas.shapes[0];
        const a = { shape: square, colors: ["A", "B", "C", "D"] };
        const b = { shape: square, colors: ["B", "A", "C", "D"] };
        const aRot = { shape: square, colors: ["D", "A", "B", "C"] };
        const aTri = { shape: triangle, colors: ["A", "B", "C", "D"] };

        expect(tileColorsEqualWithRotation(a, a)).toBe(true);
        expect(tileColorsEqualWithRotation(b, b)).toBe(true);
        expect(tileColorsEqualWithRotation(a, b)).toBe(false);
        expect(tileColorsEqualWithRotation(a, aRot)).toBe(true);
        expect(tileColorsEqualWithRotation(aRot, a)).toBe(true);
        expect(tileColorsEqualWithRotation(a, aTri)).toBe(false);
    });
});
