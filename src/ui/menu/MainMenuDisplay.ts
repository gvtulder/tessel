/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

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
import { msg, t } from "@lingui/core/macro";

export class MainMenuDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;
    settingsButton: Button;
    statisticsButton: Button;
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
        footerLine.innerHTML = t({
            id: "ui.menu.footer",
            message: `A game by <a href="https://www.vantulder.net/">Gijs van Tulder</a>.`,
        });

        if (version) {
            const versionDiv = createElement("p", "version", footer);
            versionDiv.innerHTML = version;
        }

        const buttonRow = createElement("div", "button-row", this.element);

        const settingsButton = new Button(
            icons.gearsIcon,
            msg({ id: "ui.menu.settingsButton", message: "Settings" }),
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.Settings));
            },
            "button-settings-menu",
        );
        this.settingsButton = settingsButton;
        buttonRow.appendChild(settingsButton.element);

        const statisticsButton = new Button(
            icons.chartIcon,
            msg({ id: "ui.menu.statisticsButton", message: "Statistics" }),
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.Statistics));
            },
            "button-statistics-menu",
        );
        this.statisticsButton = statisticsButton;
        buttonRow.appendChild(statisticsButton.element);

        const setupButton = new Button(
            icons.swatchbookIcon,
            msg({ id: "ui.menu.setupButton", message: "Design a game" }),
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.SetupMenu));
            },
            "button-setup-menu",
        );
        this.setupButton = setupButton;
        buttonRow.appendChild(setupButton.element);

        const paintButton = new Button(
            icons.paintbrushIcon,
            msg({ id: "ui.menu.paintButton", message: "Paint a grid" }),
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.Paint));
            },
            "button-paint-menu",
        );
        this.paintButton = paintButton;
        buttonRow.appendChild(paintButton.element);

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
        this.settingsButton.destroy();
        this.statisticsButton.destroy();
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
