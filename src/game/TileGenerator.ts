import { Shape } from "../geom/Shape";
import { TileColors, TileColor } from "../geom/Tile";
import { shuffle } from "../utils";
import { TileShapeColors } from "./TileStack";

export type TileGenerator = (
    tiles: TileShapeColors[],
    defaultShape: Shape,
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
        generator: TileGenerator,
    ): TileGenerator {
        return () => {
            const tiles: TileShapeColors[] = [];
            for (const shape of shapes) {
                tiles.push(...generator(null, shape));
            }
            return tiles;
        };
    }

    static permutations(colors: TileColors, shape?: Shape): TileGenerator {
        return (_, defaultShape: Shape) => {
            const sh = shape || defaultShape;
            const numColors = colors.length;
            const numColorGroups = sh.cornerAngles.length;

            const cToComponents = (c: number) => {
                const s = c.toString(numColors).split("");
                while (s.length < numColorGroups) s.unshift("0");
                return s;
            };
            const componentsToC = (components: string[]) =>
                parseInt(components.join(""), numColors);

            const computeEqualColors = (c: number) => {
                const equalSet: number[] = [];
                const s = cToComponents(c);
                for (let i = 0; i < s.length; i++) {
                    equalSet.push(componentsToC(s));
                    s.unshift(s.pop());
                }
                equalSet.sort();
                return equalSet;
            };

            const uniqueCs = new Set<number>();
            const maxColor = Math.pow(numColors, numColorGroups);
            for (let c = 0; c < maxColor; c++) {
                uniqueCs.add(computeEqualColors(c)[0]);
            }

            console.log(`Generated ${uniqueCs.size} tiles`);

            return [...uniqueCs.values()].map((c) => ({
                shape: sh,
                colors: cToComponents(c).map(
                    (s) => colors[parseInt(s, numColors)],
                ),
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
}
