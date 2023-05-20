import { Tile } from "src/grid/Tile.js";
import { TileColors } from "../grid/Grid.js";
import { shuffle } from "../utils.js";


const DummyTiles : TileColors[] = [
    ['red', 'blue', 'green', 'purple', 'orange', 'black'],
    ['red', 'red', 'green', 'white', 'blue', 'black'],
    ['blue', 'blue', 'green', 'red', 'black', 'black'],
    ['blue', 'red', 'blue', 'blue', 'red', 'blue'],
    ['white', 'orange', 'green', 'red', 'black', 'black'],
    ['black', 'black', 'black', 'black', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
];
const DummyTiles2 : TileColors[] = [
    ['black', 'black', 'black', 'black', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
    ['red', 'red', 'red', 'red', 'black', 'black'],
];

export type TileStackFactory = () => TileStack;

export class TileStack {
    static factoryFromArray(tiles : TileColors[]) : TileStackFactory {
        return () => new TileStack(tiles);
    }

    static factoryPermute(colors : TileColors, numTriangles : number) : TileStackFactory {
        return () => {
            const numColors = colors.length;

            const cToComponents = (c : number) => {
                const s = c.toString(numColors).split('');
                while (s.length < numColors) s.unshift('0');
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

            return new TileStack([...uniqueCs.values()].map((c) => {
                return cToComponents(c).map((s) => colors[parseInt(s, numColors)]);
            }));
        };
    }


    tiles : TileColors[];

    constructor(tileSet : TileColors[]) {
        this.tiles = [...tileSet];
        shuffle(this.tiles);
    }
    peek(n : number) : TileColors[] {
        return this.tiles.slice(0, n);
    }
    pop() : TileColors | undefined {
        if (this.tiles.length == 0) {
            return undefined;
        }
        return this.tiles.shift();
    }
    remove(idx : number) : void {
        if (idx < this.tiles.length) {
            this.tiles.splice(idx, 1);
        }
    }
    isEmpty() {
        return this.tiles.length == 0;
    }
}

export class FixedOrderTileStack extends EventTarget {
    numberShown : number;
    slots : TileColors[];
    tileStack : TileStack;

    constructor(tileStack : TileStack, numberShown : number) {
        super();
        this.tileStack = tileStack;
        this.numberShown = numberShown;
        this.slots = [];
        this.updateSlots();
    }

    updateSlots() {
        let updated = false;
        for (let i=0; i<this.numberShown; i++) {
            if (!this.slots[i]) {
                this.slots[i] = this.tileStack.pop();
                updated = true;
            }
        }
        if (updated) {
            this.dispatchEvent(new Event('updateSlots'));
        }
    }

    take(index : number) {
        this.slots[index] = null;
        this.updateSlots();
    }

    isEmpty() {
        for (const slot of this.slots) {
            if (slot) return false;
        }
        return this.tileStack.isEmpty();
    }
}