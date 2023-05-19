import { TileColors } from "../grid/Grid.js";
import { shuffle } from "../utils.js";


const DummyTiles : TileColors[] = [
    ['red', 'blue', 'green', 'purple', 'orange', 'black'],
    ['red', 'red', 'green', 'white', 'blue', 'black'],
    ['blue', 'blue', 'green', 'red', 'black', 'black'],
];

export class TileStack {
    tiles : TileColors[];

    constructor() {
        this.tiles = [...DummyTiles];
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