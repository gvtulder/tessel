import { Tile } from "src/grid/Tile.js";
import { TileColors } from "../grid/Grid.js";
import { shuffle } from "../utils.js";


export class TileStack {
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