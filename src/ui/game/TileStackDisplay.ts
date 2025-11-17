/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { FixedOrderTileStack } from "../../game/TileStack";
import { GameEventType } from "../../game/Game";
import { Tile } from "../../grid/Tile";
import { TileDragController } from "../grid/TileDragController";
import { Atlas } from "../../grid/Atlas";
import { SingleTileOnStackDisplay } from "./SingleTileStackDisplay";
import { createElement } from "../shared/html";
import { TapHandler } from "../shared/TapHandler";
import { TileCounter } from "./TileCounter";

const WIGGLE_TIMEOUT = 15000;

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

        this.element = createElement("div", "tile-stack");
    }

    destroy() {
        this.element.remove();
    }

    resetDragStatus() {
        for (const t of this.tileDisplays) {
            t.element.classList.remove("drag-success");
            t.element.classList.remove("drag-return");
            t.rotatable.classList.remove("drag-success");
            t.rotatable.classList.remove("drag-return");
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
    maxCount: number;

    updateSlotsHandler: EventListener;

    constructor(
        atlas: Atlas,
        tileStack: FixedOrderTileStack,
        tileDragController: TileDragController,
    ) {
        super(atlas, tileDragController);

        this.tileStack = tileStack;
        this.maxCount = tileStack.tilesLeft - tileStack.numberShown;

        this.updateTiles();
        this.maxCount = tileStack.tilesLeft;
        this.updateSlotsHandler = () => {
            this.updateTiles();
        };
        this.tileStack.addEventListener(
            GameEventType.UpdateSlots,
            this.updateSlotsHandler,
        );
        this.tileStack.addEventListener(
            GameEventType.UpdateTileCount,
            this.updateSlotsHandler,
        );
    }

    destroy() {
        super.destroy();
        this.tileStack.removeEventListener(
            GameEventType.UpdateSlots,
            this.updateSlotsHandler,
        );
        this.tileStack.removeEventListener(
            GameEventType.UpdateTileCount,
            this.updateSlotsHandler,
        );
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
                this.element.appendChild(tileDisplay.element);
                this.tileDisplays.push(tileDisplay);
                this.tileDragController.addSource(tileDisplay);
            }

            const slot = this.tileStack.slots[i];
            this.tileDisplays[i].showTile(slot);
            if (!slot) this.tileDisplays[i].removeDraggable();
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
