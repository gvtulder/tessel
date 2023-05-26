import { Tile } from "src/grid/Tile.js";
import { TileColors, TriangleColor } from "src/grid/Triangle.js";
import { shuffle } from "src/utils.js";

export type TileGenerator = () => TileColors[];

export class TileGenerators {
    static fromList(tiles : TileColors[]) : TileGenerator {
        return () => { return [...tiles]; };
    }

    static permutations(colors : TileColors, numTriangles : number) : TileGenerator {
        return () => {
            const numColors = colors.length;

            const cToComponents = (c : number) => {
                const s = c.toString(numColors).split('');
                while (s.length < numTriangles) s.unshift('0');
                return s;
            };
            const componentsToC = (components : string[]) => parseInt(components.join(''), numColors);

            const computeEqualColors = (c : number) => {
                const equalSet : number[] = [];
                const s = cToComponents(c);
                for (let i=0; i<s.length; i++) {
                    equalSet.push(componentsToC(s));
                    s.unshift(s.pop());
                }
                equalSet.sort();
                return equalSet;
            };

            const uniqueCs = new Set<number>();
            const maxColor = Math.pow(numColors, numTriangles);
            for (let c=0; c<maxColor; c++) {
                uniqueCs.add(computeEqualColors(c)[0]);
            }

            console.log(`Generated ${uniqueCs.size} tiles`);

            return [...uniqueCs.values()].map((c) => {
                return cToComponents(c).map((s) => colors[parseInt(s, numColors)]);
            });
        };
    }

    static repeatColors(repeats : number, generator : TileGenerator) : TileGenerator {
        return () => {
            return generator().map((t : TileColors) => {
                const tt : TriangleColor[] = [];
                for (const c of t) {
                    for (let i=0; i<repeats; i++) {
                        tt.push(c);
                    }
                }
                return tt;
            });
        }
    }

    static repeat(repeats : number, generator : TileGenerator) : TileGenerator {
        return () => {
            const tiles = generator();
            const repeatedTiles : TileColors[] = [];
            for (let i=0; i<repeats; i++) {
                repeatedTiles.push(...tiles);
            }
            return repeatedTiles;
        }
    }

    static randomSubset(n : number, generator : TileGenerator) : TileGenerator {
        return () => {
            const tiles = generator();
            shuffle(tiles);
            return tiles.slice(0, n);
        };
    }
}