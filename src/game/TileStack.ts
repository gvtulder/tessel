import { TileColors } from "../grid/Tile";
import { Shape } from "../grid/Shape";
import { shuffle } from "../geom/RandomSampler";
import { GameEvent, GameEventType } from "./Game";

export type TileShapeColors = {
    shape: Shape;
    colors: TileColors;
};

export class TileStack {
    tiles: TileShapeColors[];

    constructor(tileSet: TileShapeColors[]) {
        this.tiles = [...tileSet];
        shuffle(this.tiles);
    }
    peek(n: number): TileShapeColors[] {
        return this.tiles.slice(0, n);
    }
    pop(): TileShapeColors | undefined {
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
    removeColors(slot: TileShapeColors): boolean {
        for (let i = 0; i < this.tiles.length; i++) {
            if (tileColorsEqualWithRotation(this.tiles[i], slot)) {
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
    slots: (TileShapeColors | null | undefined)[];
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
            this.dispatchEvent(new GameEvent(GameEventType.UpdateSlots));
        }
    }

    take(index: number) {
        this.slots[index] = null;
        this.updateSlots();
    }

    removeColors(slot: TileShapeColors): boolean {
        for (let i = 0; i < this.numberShown; i++) {
            if (
                this.slots[i] &&
                tileColorsEqualWithRotation(this.slots[i]!, slot)
            ) {
                this.slots[i] = null;
                this.updateSlots();
                return true;
            }
        }
        return this.tileStack.removeColors(slot);
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

function tileColorsEqualWithRotation(
    a: TileShapeColors,
    b: TileShapeColors,
): boolean {
    if (a.shape !== b.shape) return false;
    for (let i = 0; i < a.colors.length; i++) {
        let ok = true;
        for (let j = 0; j < b.colors.length && ok; j++) {
            if (a.colors[i] != b.colors[j]) ok = false;
        }
        if (ok) return true;
    }
    return false;
}
