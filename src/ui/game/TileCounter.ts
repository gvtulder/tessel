/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { createElement } from "../shared/html";
import { SVG } from "../shared/svg";
import { TapHandler } from "../shared/TapHandler";
import { GameEventType } from "../../game/GameEvent";
import { TileStackWithSlots } from "../../game/TileStackWithSlots";
import { DestroyableEventListenerSet } from "../shared/DestroyableEventListenerSet";

const STROKE_WIDTH = 1;
const RADIUS = 2;
const TILE_WIDTH = 10;
const TILE_HEIGHT = 10;
const SPREAD_WIDTH = 7;
const SPREAD_HEIGHT = 5;

export class TileCounter {
    element: HTMLDivElement;
    span: HTMLSpanElement;

    tapHandler: TapHandler;
    listeners: DestroyableEventListenerSet;

    tileStack: TileStackWithSlots;
    currentCount: number = -1;

    constructor(tileStack: TileStackWithSlots) {
        this.element = createElement("div", "tile-counter");

        const span = createElement("span", "number", this.element);
        this.span = span;

        this.tapHandler = new TapHandler(this.element);

        this.tileStack = tileStack;

        this.listeners = new DestroyableEventListenerSet();
        this.listeners.addEventListener(
            this.tileStack,
            GameEventType.UpdateTileCount,
            () => this.update(),
        );

        this.update();
    }

    update() {
        let numTiles = this.tileStack.tilesOnStack;
        if (!numTiles || numTiles < 0) {
            numTiles = 0;
        }
        this.span.innerHTML = `+${numTiles}`;
        this.draw(numTiles);
    }

    draw(numTiles: number) {
        if (numTiles > 10) {
            numTiles = 4;
        } else if (numTiles >= 3) {
            numTiles = 3;
        }

        if (numTiles == this.currentCount) {
            return;
        }
        this.currentCount = numTiles;
    }

    destroy() {
        this.listeners.removeAll();
        this.tapHandler.destroy();
        this.element.remove();
    }
}
