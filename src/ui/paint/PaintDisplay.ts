/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "../../grid/Grid";
import { TileColor } from "../../grid/Tile";
import icons from "../shared/icons";
import {
    NavigateEvent,
    Pages,
    UserEvent,
    UserEventType,
} from "../shared/UserEvent";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { PaintGridDisplay } from "./PaintGridDisplay";
import { ColorStackDisplay } from "./ColorStackDisplay";
import { WONG6 } from "../../saveGames";
import { msg } from "@lingui/core/macro";

export class PaintDisplay extends ScreenDisplay {
    grid: Grid;

    gridDisplay: PaintGridDisplay;
    colorStackDisplay: ColorStackDisplay;

    element: HTMLDivElement;

    backtomenubutton: Button;

    constructor(grid: Grid) {
        super();
        this.grid = grid;

        const colors = WONG6;

        if (grid.tiles.size == 0) {
            const tile = grid.addInitialTile();
            tile.colors = colors[0];
            grid.generatePlaceholders();
        }

        // main element
        const element = (this.element = createElement(
            "div",
            "screen paint-display",
        ));

        // main grid
        const divGridContainer = createElement("div", "paint-grid", element);
        const gridDisplay = (this.gridDisplay = new PaintGridDisplay(
            this.grid,
            divGridContainer,
            this,
        ));
        divGridContainer.appendChild(gridDisplay.element);

        // color stack display
        const colorStackDisplay = new ColorStackDisplay(this, colors);
        this.colorStackDisplay = colorStackDisplay;
        this.element.appendChild(colorStackDisplay.element);

        // filler element to add to the bottom/side of the paint stack
        createElement("div", "fill-end", element);

        // the home button
        const menu = createElement("div", "paint-menu", element);

        this.backtomenubutton = new Button(
            icons.houseIcon,
            msg({ id: "ui.menu.backToMenuButton", message: "Back to menu" }),
            () => this.dispatchEvent(new UserEvent(UserEventType.BackToMenu)),
            "backtomenu",
        );
        menu.appendChild(this.backtomenubutton.element);

        // initial scaling
        this.rescale();
    }

    get currentColor(): TileColor | null {
        return this.colorStackDisplay.currentColor;
    }

    destroy() {
        this.element.remove();
        this.backtomenubutton.destroy();
        this.colorStackDisplay.destroy();
        this.gridDisplay.destroy();
    }

    rescale() {
        this.gridDisplay.rescale();
    }
}
