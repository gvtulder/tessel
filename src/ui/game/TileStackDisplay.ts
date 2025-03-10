import type { Interactable } from "@interactjs/types";
import "@interactjs/auto-start";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";

import { Grid } from "../../grid/Grid";
import { FixedOrderTileStack, TileShapeColors } from "../../game/TileStack";
import { GameEventType } from "../../game/Game";
import { Tile, TileColors } from "../../grid/Tile";
import { Shape } from "../../grid/Shape";
import { GridDisplay } from "../grid/GridDisplay";
import { TileStackGridDisplay } from "./TileStackGridDisplay";
import { TransformComponent } from "../../geom/Transform";
import {
    TileDragController,
    TileDragSource,
    TileRotationSet,
} from "../grid/TileDragController";
import { Atlas } from "../../grid/Atlas";
import { angleDist, RAD2DEG, TWOPI } from "../../geom/math";
import { SingleTileOnStackDisplay } from "./SingleTileStackDisplay";

export abstract class BaseTileStackDisplay extends EventTarget {
    static events = {
        TapTile: "taptile",
    };

    atlas: Atlas;
    tileDragController: TileDragController;

    tileDisplays: SingleTileOnStackDisplay[];
    element: HTMLDivElement;

    constructor(atlas: Atlas, tileDragController: TileDragController) {
        super();
        this.atlas = atlas;
        this.tileDragController = tileDragController;
        this.tileDisplays = [];

        const div = document.createElement("div");
        div.className = "tile-stack";
        this.element = div;
    }

    /** @deprecated */
    destroy() {
        return;
    }

    resetDragStatus() {
        for (const t of this.tileDisplays) {
            t.element.classList.remove("drag-success");
            t.element.classList.remove("drag-return");
        }
    }

    rescale() {
        for (const t of this.tileDisplays) {
            t.rescale();
        }
    }
}

export class TileStackDisplay extends BaseTileStackDisplay {
    tileStack: FixedOrderTileStack;
    counterDiv: HTMLElement;
    counter: HTMLElement;

    constructor(
        atlas: Atlas,
        tileStack: FixedOrderTileStack,
        tileDragController: TileDragController,
    ) {
        super(atlas, tileDragController);

        this.tileStack = tileStack;

        const counterDiv = document.createElement("div");
        this.element.appendChild(counterDiv);
        counterDiv.className = "tile-counter";
        this.counterDiv = counterDiv;

        const counter = document.createElement("span");
        counterDiv.appendChild(counter);
        this.counter = counterDiv;

        this.updateTiles();
        this.tileStack.addEventListener(GameEventType.UpdateSlots, () => {
            this.updateTiles();
        });
    }

    /** @deprecated */
    destroy() {
        return;
    }

    updateTiles() {
        for (let i = 0; i < this.tileStack.numberShown; i++) {
            if (this.tileDisplays.length <= i) {
                const tileDisplay = new SingleTileOnStackDisplay(
                    this,
                    i,
                    this.atlas,
                    true,
                );
                this.element.insertBefore(tileDisplay.element, this.counterDiv);
                this.tileDisplays.push(tileDisplay);
                this.tileDragController.addSource(tileDisplay);
            }

            const slot = this.tileStack.slots[i];
            this.tileDisplays[i].showTile(slot);
            if (!slot) this.tileDisplays[i].removeDraggable();
        }
        const n = this.tileStack.tilesLeft - this.tileStack.numberShown;
        if (n > 0) {
            this.counter.innerHTML = `+ ${n} tile${n == 1 ? "" : "s"}`;
        } else {
            this.counter.innerHTML = "";
        }
    }

    take(tile: Tile) {
        let index = 0;
        while (
            index < this.tileStack.numberShown &&
            !(this.tileDisplays[index].tile === tile)
        ) {
            index++;
        }
        if (index < this.tileStack.numberShown) {
            this.tileStack.take(index);
            this.updateTiles();
        }
    }
}

export interface DraggableTileHTMLDivElement extends HTMLDivElement {
    tileDisplay?: SingleTileOnStackDisplay;
    indexOnStack?: number;
}
