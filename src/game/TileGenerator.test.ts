/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { TileGenerators } from "./TileGenerator";
import { Shape } from "../grid/Shape";
import { SquaresAtlas } from "../grid/atlas/SquaresAtlas";
import { TrianglesAtlas } from "../grid/atlas/TrianglesAtlas";
import { TileShapeColors } from "./TileStack";

function colorsWithShape(
    colorList: string[][],
    shape: Shape,
): TileShapeColors[] {
    return colorList.map((c) => ({ colors: c, shape: shape }));
}

function tilesToSet(tiles: TileShapeColors[]): Set<string> {
    return new Set<string>(
        tiles.map((t) => t.colors.join("-") + ` ${t.shape.name}`),
    );
}

describe("TileGenerator", () => {
    const triangle = TrianglesAtlas.shapes[0];
    const square = SquaresAtlas.shapes[0];

    describe("fromList", () => {
        const input = [
            ["A", "A"],
            ["A", "B"],
        ];

        test("basic", () => {
            const generator = TileGenerators.fromList(input);
            expect(generator([], triangle)).toEqual(
                colorsWithShape(input, triangle),
            );
        });

        test("with shape", () => {
            const generator = TileGenerators.fromList(input, triangle);
            expect(generator([], square)).toEqual(
                colorsWithShape(input, triangle),
            );
        });
    });

    describe("forShapes", () => {
        const colors = ["A", "B", "C", "D"];

        test("one shape", () => {
            const expected = TileGenerators.permutations(colors)([], triangle);

            expect(
                TileGenerators.forShapes(
                    [triangle],
                    TileGenerators.permutations(colors),
                    undefined,
                    new Map([[triangle, 1]]),
                )([], triangle).length,
            ).toEqual(24);
        });

        test("two shapes", () => {
            const tiles = TileGenerators.forShapes(
                [triangle, square],
                TileGenerators.permutations(colors),
                undefined,
                new Map([
                    [triangle, 2],
                    [square, 1],
                ]),
            )([], triangle);
            expect(tiles.length).toBe(214);
            // approximate proportions should be 2 : 1
            expect([...tiles.filter((t) => t.shape === triangle)].length).toBe(
                144,
            );
            expect([...tiles.filter((t) => t.shape === square)].length).toBe(
                70,
            );
        });
    });

    describe("permutations", () => {
        const colors = ["A", "B", "C", "D"];

        test("basic triangle", () => {
            const generator = TileGenerators.permutations(colors);
            const tiles = generator([], triangle);
            expect(tiles.length).toEqual(24);
            expect(tilesToSet(tiles).size).toEqual(tiles.length);
        });

        test("basic square", () => {
            const generator = TileGenerators.permutations(colors);
            const tiles = generator([], square);
            expect(tiles.length).toEqual(70);
            expect(tilesToSet(tiles).size).toEqual(tiles.length);
        });

        test("onlyUniqueColors", () => {
            const generator = TileGenerators.permutations(
                colors,
                undefined,
                true,
            );
            expect(generator([], triangle).length).toEqual(8);
            expect(generator([], square).length).toEqual(6);
        });

        test("with segments", () => {
            const generator = TileGenerators.permutations(colors);
            expect(
                generator([], square, {
                    numColors: 2,
                    segmentColors: [[0, 0, 1, 1]],
                }).length,
            ).toEqual(10);
        });
    });

    describe("repeatColors", () => {
        const input = colorsWithShape(
            [
                ["A", "A"],
                ["A", "B"],
            ],
            triangle,
        );
        const output = colorsWithShape(
            [
                ["A", "A", "A", "A"],
                ["A", "A", "B", "B"],
            ],
            triangle,
        );

        test("basic", () => {
            const generator = TileGenerators.repeatColors(2);
            expect(generator(input, triangle)).toEqual(output);
        });
    });

    describe("onlyUniqueColors", () => {
        const input = colorsWithShape(
            [
                ["A", "A"],
                ["A", "A"],
                ["A", "B"],
                ["A", "B"],
                ["A", "C"],
            ],
            triangle,
        );
        const output = colorsWithShape(
            [
                ["A", "A"],
                ["A", "B"],
                ["A", "C"],
            ],
            triangle,
        );

        test("basic", () => {
            const generator = TileGenerators.onlyUniqueColors();
            const tiles = generator(input, triangle);
            expect(new Set(input.map((c) => c.colors.join(" ")))).toEqual(
                new Set(output.map((c) => c.colors.join(" "))),
            );
        });
    });

    describe("repeat", () => {
        const colors = ["A", "B", "C", "D"];
        const tiles = TileGenerators.permutations(colors)([], triangle);

        test("basic", () => {
            const generator = TileGenerators.repeat(2);
            const repeatedTiles = generator(tiles, triangle);
            expect(repeatedTiles.length).toEqual(2 * tiles.length);
        });
    });

    describe("randomSubset", () => {
        const colors = ["A", "B", "C", "D"];
        const tiles = TileGenerators.permutations(colors)([], triangle);

        test("basic", () => {
            expect(tiles.length).toEqual(24);
            expect(
                TileGenerators.randomSubset(10)(tiles, triangle).length,
            ).toEqual(10);
            expect(
                TileGenerators.randomSubset(30)(tiles, triangle).length,
            ).toEqual(24);
        });
    });

    describe("ensureNumber", () => {
        const colors = ["A", "B", "C", "D"];
        const tiles = TileGenerators.permutations(colors)([], triangle);

        test("basic", () => {
            expect(tiles.length).toEqual(24);
            expect(
                TileGenerators.ensureNumber(10, 12)(tiles, triangle).length,
            ).toEqual(12);
            expect(
                TileGenerators.ensureNumber(40, 60)(tiles, triangle).length,
            ).toEqual(48);
        });
    });
});
