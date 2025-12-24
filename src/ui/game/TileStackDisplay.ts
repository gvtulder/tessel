/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { TileStackWithSlots } from "../../game/TileStackWithSlots";
import { GameEventType } from "../../game/GameEvent";
import { Tile } from "../../grid/Tile";
import { TileDragController } from "../grid/TileDragController";
import { Atlas } from "../../grid/Atlas";
import { SingleTileOnStackDisplay } from "./SingleTileStackDisplay";
import { createElement } from "../shared/html";
import { DestroyableEventListenerSet } from "../shared/DestroyableEventListenerSet";

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
    tileStack: TileStackWithSlots;

    listeners: DestroyableEventListenerSet;

    constructor(
        atlas: Atlas,
        tileStack: TileStackWithSlots,
        tileDragController: TileDragController,
    ) {
        super(atlas, tileDragController);

        this.tileStack = tileStack;

        this.updateTiles();

        this.listeners = new DestroyableEventListenerSet();
        this.listeners
            .forTarget(this.tileStack)
            .addEventListener(GameEventType.UpdateSlots, () =>
                this.updateTiles(),
            )
            .addEventListener(GameEventType.UpdateTileCount, () =>
                this.updateTiles(),
            );
    }

    destroy() {
        super.destroy();
        this.listeners.removeAll();
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
