// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import icons from "../shared/icons";
import { Grid } from "../../grid/Grid";
import { GridDisplay } from "../grid/GridDisplay";
import { MainMenuGridDisplay } from "./MainMenuGridDisplay";
import * as SaveGames from "../../saveGames";
import { UserEvent, UserEventType } from "../GameController";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { Button } from "../shared/Button";
import { createElement } from "../shared/html";
import { TapHandler } from "../shared/TapHandler";
import { AngleUse } from "../../grid/Shape";
import SVG_LOGO from "bundle-text:../svgs/logo.svg";

export class MainMenuDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;
    setupButton: Button;
    paintButton: Button;
    grids: Grid[];
    gridDisplays: GridDisplay[];
    tappables: TapHandler[];

    constructor(version?: string) {
        super();

        const div = createElement("div", "screen main-menu");
        this.element = div;

        const footer = createElement("div", "footer", div);

        const footerLine = createElement("p", "copyright", footer);
        footerLine.innerHTML =
            `A game by <a href="https://www.vantulder.net/">Gijs van Tulder</a>. <br/>` +
            `View <a href="https://tessel.vantulder.net/source/">source code</a> and <a href="https://tessel.vantulder.net/about/">documentation</a>.`;

        if (version) {
            const versionDiv = createElement("p", "version", footer);
            versionDiv.innerHTML = version;
        }

        const setupButton = new Button(
            icons.swatchbookIcon,
            "Design a game",
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.SetupMenu));
            },
            "button-setup-menu",
        );
        this.setupButton = setupButton;
        this.element.appendChild(setupButton.element);

        const paintButton = new Button(
            icons.paintbrushIcon,
            "Paint a grid",
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.Paint));
            },
            "button-paint-menu",
        );
        this.paintButton = paintButton;
        this.element.appendChild(paintButton.element);

        const container = createElement("div", "container", div);
        const logo = createElement("div", "logo", container);
        logo.innerHTML = SVG_LOGO;
        const gameList = createElement("div", "game-list", container);

        this.grids = [];
        this.gridDisplays = [];
        this.tappables = [];

        for (const saveGameId of SaveGames.defaultGameList) {
            const gameSettings = SaveGames.lookup.get(saveGameId);
            if (!gameSettings) continue;

            const exampleTile = document.createElement("div");
            exampleTile.className = "example-tile";
            gameList.appendChild(exampleTile);

            const grid = new Grid(gameSettings.atlas);
            const shape = grid.atlas.shapes[0];
            const poly = shape.constructPreferredPolygon(
                0,
                0,
                grid.atlas.scale,
                AngleUse.MainMenu,
            );
            const tile = grid.addTile(shape, poly, poly.segment());
            tile.colors = gameSettings.initialTile;

            this.grids.push(grid);

            const gridDisplay = new MainMenuGridDisplay(grid, exampleTile);
            this.gridDisplays.push(gridDisplay);
            exampleTile.appendChild(gridDisplay.element);

            const tappable = new TapHandler(exampleTile);
            tappable.onTap = () => {
                this.dispatchEvent(
                    new UserEvent(
                        UserEventType.StartGame,
                        gameSettings,
                        saveGameId,
                    ),
                );
            };
            this.tappables.push(tappable);
        }
    }

    destroy() {
        for (const d of this.tappables) {
            d.destroy();
        }
        for (const gd of this.gridDisplays) {
            gd.destroy();
        }
        this.setupButton.destroy();
        this.paintButton.destroy();
        this.tappables = [];
        this.gridDisplays = [];
        this.grids = [];
        this.element.remove();
    }

    rescale() {
        for (const gridDisplay of this.gridDisplays) {
            gridDisplay.triggerRescale();
        }
    }
}
