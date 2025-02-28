import { Shape } from "../geom/Shape";
import { TileColors, TileColor } from "../geom/Tile";
import { shuffle } from "../utils";

export type TileGenerator = (tiles: TileColors[], shape: Shape) => TileColors[];

export class TileGenerators {
    static fromList(tiles: TileColors[]): TileGenerator {
        return () => {
            return [...tiles];
        };
    }

    static permutations(colors: TileColors): TileGenerator {
        return (tiles: TileColors[], shape: Shape) => {
            const numColors = colors.length;
            const numColorGroups = shape.cornerAngles.length;

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

            return [...uniqueCs.values()].map((c) => {
                return cToComponents(c).map(
                    (s) => colors[parseInt(s, numColors)],
                );
            });
        };
    }

    static repeatColors(repeats: number): TileGenerator {
        return (tiles: TileColors[]) => {
            return tiles.map((t: TileColors) => {
                const tt: TileColor[] = [];
                for (const c of t) {
                    for (let i = 0; i < repeats; i++) {
                        tt.push(c);
                    }
                }
                return tt;
            });
        };
    }

    static repeat(repeats: number): TileGenerator {
        return (tiles: TileColors[]) => {
            const repeatedTiles: TileColors[] = [];
            for (let i = 0; i < repeats; i++) {
                repeatedTiles.push(...tiles);
            }
            return repeatedTiles;
        };
    }

    static randomSubset(n: number): TileGenerator {
        return (tiles: TileColors[]) => {
            shuffle(tiles);
            return tiles.slice(0, n);
        };
    }
}
