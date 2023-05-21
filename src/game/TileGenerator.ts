import { TileColors } from "src/grid/Grid.js";
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

    static randomSubset(n : number, generator : TileGenerator) : TileGenerator {
        return () => {
            const tiles = generator();
            shuffle(tiles);
            return tiles.slice(0, n);
        };
    }
}