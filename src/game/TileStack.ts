import { TileColors } from "../grid/Triangle.js";
import { shuffle } from "../utils.js";

export class TileStack {
    tiles: TileColors[];

    constructor(tileSet: TileColors[]) {
        this.tiles = [...tileSet];
        shuffle(this.tiles);
    }
    peek(n: number): TileColors[] {
        return this.tiles.slice(0, n);
    }
    pop(): TileColors | undefined {
        if (this.tiles.length == 0) {
            return undefined;
        }
        return this.tiles.shift();
    }
    removeWithIndex(idx: number): void {
        if (idx < this.tiles.length) {
            this.tiles.splice(idx, 1);
        }
    }
    removeColors(colors: TileColors): boolean {
        for (let i = 0; i < this.tiles.length; i++) {
            if (tileColorsEqualWithRotation(this.tiles[i], colors)) {
                console.log("removing duplicate!");
                this.removeWithIndex(i);
                return true;
            }
        }
        return false;
    }
    get tilesLeft(): number {
        return this.tiles.length;
    }
    isEmpty() {
        return this.tiles.length == 0;
    }
}

export class FixedOrderTileStack extends EventTarget {
    numberShown: number;
    slots: TileColors[];
    tileStack: TileStack;

    constructor(tileStack: TileStack, numberShown: number) {
        super();
        this.tileStack = tileStack;
        this.numberShown = numberShown;
        this.slots = [];
        this.updateSlots();
    }

    updateSlots() {
        let updated = false;
        for (let i = 0; i < this.numberShown; i++) {
            if (!this.slots[i]) {
                this.slots[i] = this.tileStack.pop();
                updated = true;
            }
        }
        if (updated) {
            this.dispatchEvent(new Event("updateSlots"));
        }
    }

    take(index: number) {
        this.slots[index] = null;
        this.updateSlots();
    }

    removeColors(colors: TileColors): boolean {
        for (let i = 0; i < this.numberShown; i++) {
            if (
                this.slots[i] &&
                tileColorsEqualWithRotation(this.slots[i], colors)
            ) {
                this.slots[i] = null;
                this.updateSlots();
                return true;
            }
        }
        return this.tileStack.removeColors(colors);
    }

    get tilesLeft(): number {
        let n = this.tileStack.tilesLeft;
        for (const slot of this.slots) {
            if (slot) n++;
        }
        return n;
    }

    isEmpty() {
        for (const slot of this.slots) {
            if (slot) return false;
        }
        return this.tileStack.isEmpty();
    }
}

function tileColorsEqualWithRotation(a: TileColors, b: TileColors): boolean {
    const aS = a.join("-");
    for (let i = 0; i < b.length; i++) {
        b = [...b.slice(1), b[0]];
        if (aS == b.join("-")) {
            return true;
        }
    }
    return false;
}
