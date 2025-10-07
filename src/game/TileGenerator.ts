/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { ColorPattern, ColorPatternPerShape, Shape } from "../grid/Shape";
import { TileColors, TileColor } from "../grid/Tile";
import { randomRotate, shuffle } from "../geom/RandomSampler";
import { TileShapeColors } from "./TileStack";
import { rotateArray } from "../geom/arrays";

export type TileGenerator = (
    tiles: TileShapeColors[],
    defaultShape: Shape,
    colorPattern?: ColorPattern,
) => TileShapeColors[];

export class TileGenerators {
    static fromList(colors: TileColors[], shape?: Shape): TileGenerator {
        return (_, defaultShape: Shape) =>
            colors.map((c) => ({
                shape: shape || defaultShape,
                colors: c,
            }));
    }

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
            const minProp = Math.min(...proportion);
            const repetitions = proportion.map((p) => Math.round(p / minProp));
            console.log("Required tile repetitions per shape:", repetitions);
            const tiles: TileShapeColors[] = [];
            for (let i = 0; i < shapes.length; i++) {
                for (let r = 0; r < repetitions[i]; r++) {
                    tiles.push(...tilesPerShape[i]);
                }
            }
            return tiles;
        };
    }

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

            const cToComponents = (c: number, numGroups: number) => {
                const s = c.toString(numColors).split("");
                while (s.length < numGroups) s.unshift("0");
                return s;
            };
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

            console.log(`Generated ${uniqueCs.size} tiles`);

            return mappedColors.map((colors) => ({
                shape: sh,
                colors: colors,
            }));
        };
    }

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

    static onlyUniqueColors(): TileGenerator {
        return (tiles: TileShapeColors[]) =>
            tiles.filter(
                (t: TileShapeColors) =>
                    new Set(t.colors).size == t.colors.length,
            );
    }

    static repeat(repeats: number): TileGenerator {
        return (tiles: TileShapeColors[]) => {
            const repeatedTiles: TileShapeColors[] = [];
            for (let i = 0; i < repeats; i++) {
                repeatedTiles.push(...tiles);
            }
            return repeatedTiles;
        };
    }

    static randomSubset(n: number): TileGenerator {
        return (tiles: TileShapeColors[]) => {
            shuffle(tiles);
            return tiles.slice(0, n);
        };
    }

    static ensureNumber(min: number, max: number): TileGenerator {
        return (tiles: TileShapeColors[]) => {
            shuffle(tiles);
            if (min <= tiles.length && tiles.length <= max) {
                return tiles;
            }
            const selectedTiles: TileShapeColors[] = [];
            for (let i = Math.round((max + min) / 2); i >= 0; i--) {
                selectedTiles.push(tiles[i % tiles.length]);
            }
            return selectedTiles;
        };
    }
}
