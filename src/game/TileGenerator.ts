/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { ColorPattern, ColorPatternPerShape, Shape } from "../grid/Shape";
import { TileColors, TileColor } from "../grid/Tile";
import { randomRotate, shuffle } from "../geom/RandomSampler";
import { TileShapeColors } from "./TileStack";
import { rotateArray } from "../geom/arrays";

/**
 * Generate a tile list.
 *
 * A TileGenerator is a function that returns a list of tiles.
 * Some generators take a list of tiles as input and return a
 * modified list, others generate a list from scratch.
 *
 * @param tiles the input tile list or an empty list
 * @param defaultShape the default shape for the tiles
 * @param colorPattern the color pattern to use
 * @returns a list of tiles (colors and shape)
 */
export type TileGenerator = (
    tiles: TileShapeColors[],
    defaultShape: Shape,
    colorPattern?: ColorPattern,
) => TileShapeColors[];

/**
 * A collection of TileGenerators.
 */
export class TileGenerators {
    /**
     * Return a predefined list of colors for the given shape.
     *
     * @param colors the list of tile colors
     * @param shape the shape
     * @returns a TileGenerator that returns the colors combined with the shape
     */
    static fromList(colors: TileColors[], shape?: Shape): TileGenerator {
        return (_, defaultShape: Shape) =>
            colors.map((c) => ({
                shape: shape || defaultShape,
                colors: c,
            }));
    }

    /**
     * Generate tiles for one or more shapes.
     *
     * For each shape, this runs the given generator (e.g., a permutation
     * generator) to generate tile colorings for the given coloring pattern.
     * The generated tiles are then repeated, if necessary, to ensure the
     * required frequency for each shape in the final tile list.
     *
     * @param shapes the shape to generate tiles for
     * @param generator the generator or generator pipeline for the initial tile list
     * @param colorPatternPerShape the color pattern for each shape
     * @param shapeFrequencies the frequency for each shape
     * @returns a tile generator that generates tiles
     */
    static forShapes(
        shapes: readonly Shape[],
        generator: TileGenerator | TileGenerator[],
        colorPatternPerShape?: ColorPatternPerShape,
        shapeFrequencies?: ReadonlyMap<Shape, number>,
    ): TileGenerator {
        if (generator instanceof Function) {
            generator = [generator];
        }
        return () => {
            const tilesPerShape: TileShapeColors[][] = [];
            const proportion: number[] = [];
            // generate the tiles for each shape
            for (const shape of shapes) {
                const colorPattern = colorPatternPerShape
                    ? colorPatternPerShape.get(shape)
                    : undefined;
                let tilesForShape = generator[0]([], shape, colorPattern);
                for (let j = 1; j < generator.length; j++) {
                    tilesForShape = generator[j](
                        tilesForShape,
                        shape,
                        colorPattern,
                    );
                }
                tilesPerShape.push(tilesForShape);
                proportion.push(
                    shapeFrequencies!.get(shape)! / tilesForShape.length,
                );
            }
            // repeat tiles to obtain the required proportion
            const minProp = Math.min(...proportion);
            const repetitions = proportion.map((p) => Math.round(p / minProp));
            const tiles: TileShapeColors[] = [];
            for (let i = 0; i < shapes.length; i++) {
                for (let r = 0; r < repetitions[i]; r++) {
                    tiles.push(...tilesPerShape[i]);
                }
            }
            return tiles;
        };
    }

    /**
     * Return the list of all rotation-invariant permutations of colors
     * for the given shape.
     *
     * @param colors a list of colors
     * @param shape the shape to be colored
     * @param onlyUniqueColors if true, all colors on a tile must be unique
     * @returns a tile generator that returns all possible tile variants
     */
    static permutations(
        colors: TileColors,
        shape?: Shape,
        onlyUniqueColors?: boolean,
    ): TileGenerator {
        return (_, defaultShape: Shape, colorPattern?: ColorPattern) => {
            const sh = shape || defaultShape;
            const numColors = colors.length;
            const numColorGroups = colorPattern
                ? colorPattern.numColors
                : sh.cornerAngles.length;

            // This function generates tile permutations by enumerating
            // all numbers from 0 to ncolors^ngroups. The numbers are then
            // mapped to and from a color sequences by expressing
            // them as base-{ncolors} strings.
            //
            // E.g., for squares with four colors:
            // 5 -> 0011 -> [colors[0], colors[0], colors[1], colors[1]]

            // convert a number to a color sequence
            const cToComponents = (c: number, numGroups: number) => {
                const s = c.toString(numColors).split("");
                while (s.length < numGroups) s.unshift("0");
                return s;
            };
            // convert a color sequence to a number
            const componentsToC = (components: string[]) =>
                parseInt(components.join(""), numColors);

            const uniqueCs = new Set<number>();
            const addToUniqueCs = (components: string[]) => {
                // compute rotation variants
                let minC: number | null = null;
                for (const r of sh.rotationalSymmetries) {
                    const rotatedC = componentsToC(rotateArray(components, r));
                    if (minC == null || rotatedC < minC) minC = rotatedC;
                }
                uniqueCs.add(minC!);
            };

            const maxColor = Math.pow(numColors, numColorGroups);
            // enumerate all possible permutations
            for (let c = 0; c < maxColor; c++) {
                // map to segment colors
                const components = cToComponents(c, numColorGroups);
                if (onlyUniqueColors) {
                    if (new Set(components).size != components.length) {
                        continue;
                    }
                }
                addToUniqueCs(components);
            }

            // map groups to segments
            const mappedColors = [];
            for (const c of uniqueCs) {
                let cc = cToComponents(c, numColorGroups);
                // shuffle the starting point of the colors
                cc = randomRotate(cc);
                if (colorPattern) {
                    // use the first segment order of the pattern only,
                    // because the others should all be rotation variants
                    cc = colorPattern.segmentColors[0].map((i) => cc[i]);
                }
                mappedColors.push(
                    cc.map((s) => colors[parseInt(s, numColors)]),
                );
            }

            return mappedColors.map((colors) => ({
                shape: sh,
                colors: colors,
            }));
        };
    }

    /**
     * Repeat each color n times.
     *
     * For example:
     * ["A", "B"] -> ["A", "A", "B", "B"]
     *
     * @param repeats the number of repeats
     * @returns a tile generator that repeats colors
     */
    static repeatColors(repeats: number): TileGenerator {
        return (tiles: TileShapeColors[]) => {
            return tiles.map((t: TileShapeColors) => {
                const tt: TileColor[] = [];
                for (const c of t.colors) {
                    for (let i = 0; i < repeats; i++) {
                        tt.push(c);
                    }
                }
                return { shape: t.shape, colors: tt };
            });
        };
    }

    /**
     * Filter the tile list to include only tiles where every color
     * is unique.
     *
     * @returns a tile generator that only returns tiles with unique colors
     */
    static onlyUniqueColors(): TileGenerator {
        return (tiles: TileShapeColors[]) =>
            tiles.filter(
                (t: TileShapeColors) =>
                    new Set(t.colors).size == t.colors.length,
            );
    }

    /**
     * Repeats the input tile list n times.
     *
     * @param repeats the number of repeats
     * @returns a tile generator that returns a repeated tile list
     */
    static repeat(repeats: number): TileGenerator {
        return (tiles: TileShapeColors[]) => {
            const repeatedTiles: TileShapeColors[] = [];
            for (let i = 0; i < repeats; i++) {
                repeatedTiles.push(...tiles);
            }
            return repeatedTiles;
        };
    }

    /**
     * Return a random subset of n tiles from the input tile list.
     *
     * @param n the number of tiles to return
     * @returns a tile generator that returns a random subset of tiles
     */
    static randomSubset(n: number): TileGenerator {
        return (tiles: TileShapeColors[]) => {
            shuffle(tiles);
            return tiles.slice(0, n);
        };
    }

    /**
     * Repeats or subsamples tiles to obtain the required number.
     *
     * 1. If the number of tiles is less than the minimum,
     *    the tile list is repeated.
     * 2. If there are more than the maximum number of tiles, the
     *    tile list is subsampled to return (max + min) / 2 tiles
     *
     * @param min the minimum number of tiles
     * @param max the maximum number of tiles
     * @returns a tile generator that repeats or subsamples the input
     */
    static ensureNumber(min: number, max: number): TileGenerator {
        return (tiles: TileShapeColors[]) => {
            let selectedTiles: TileShapeColors[] = [];
            // repeat tiles if necessary
            while (selectedTiles.length < min) {
                selectedTiles = selectedTiles.concat(tiles);
            }
            shuffle(selectedTiles);
            if (selectedTiles.length <= max) {
                return selectedTiles;
            }
            // select a subset
            tiles = selectedTiles;
            selectedTiles = [];
            for (let i = Math.round((max + min) / 2); i >= 0; i--) {
                selectedTiles.push(tiles[i % tiles.length]);
            }
            return selectedTiles;
        };
    }
}
