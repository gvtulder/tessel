/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "../../grid/Grid";
import { GridDisplay } from "../grid/GridDisplay";
import { MainMenuGridDisplay } from "./MainMenuGridDisplay";
import { lookup as SaveGamesLookup } from "../../saveGames";
import { UserEvent } from "../shared/UserEvent";
import { UserEventType } from "../shared/UserEvent";
import { createElement } from "../shared/html";
import { AngleUse } from "../../grid/Shape";
import { rotateArray } from "../../geom/arrays";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { TapHandler } from "../shared/TapHandler";
import { TileColor } from "../../grid/Tile";
import { GameSettings } from "../../game/Game";

export class GameListDisplay extends ScreenDisplay {
    element: HTMLDivElement;
    grids: Grid[];
    gridDisplays: GridDisplay[];
    tappables: TapHandler[];

    constructor(gameList: string[], fixedColor?: TileColor) {
        super();

        const div = createElement("div", "screen with-navbar game-list");
        this.element = div;
        this.grids = [];
        this.gridDisplays = [];
        this.tappables = [];

        // game list
        const gameListContainer = createElement(
            "div",
            "atlas-picker-grid",
            div,
        );

        for (const saveGameId of gameList) {
            const gameSettings = SaveGamesLookup.get(saveGameId);
            if (!gameSettings) continue;

            const exampleTile = document.createElement("div");
            exampleTile.className = "atlas-picker-option";
            gameListContainer.appendChild(exampleTile);

            const grid = new Grid(gameSettings.atlas);
            const shape = grid.atlas.shapes[0];
            const poly = shape.constructPreferredPolygon(
                0,
                0,
                grid.atlas.scale,
                AngleUse.MainMenu,
            );
            const tile = grid.addTile(shape, poly, poly.segment());
            tile.colors = fixedColor || gameSettings.initialTile;

            for (let i = 1; i < grid.atlas.shapes.length; i++) {
                const otherShape = grid.atlas.shapes[i];
                const otherPoly = otherShape.constructPolygonEdge(
                    poly.outsideEdges[i],
                    0,
                );
                const otherTile = grid.addTile(
                    otherShape,
                    otherPoly,
                    otherPoly.segment(),
                );
                // rotate the colors until they match the first tile
                otherTile.colors =
                    fixedColor ||
                    rotateArray(
                        gameSettings.initialTile,
                        gameSettings.initialTile.indexOf(tile.colors![i]),
                    );
            }

            this.grids.push(grid);

            const gridDisplay = new MainMenuGridDisplay(grid, exampleTile);
            this.gridDisplays.push(gridDisplay);
            exampleTile.appendChild(gridDisplay.element);

            const tappable = new TapHandler(exampleTile);
            tappable.onTap = () => {
                // animate zoom and translate
                this.element.classList.add("starting-game");
                exampleTile.classList.add("selected-game");

                this.handleTap(gameSettings, saveGameId);
            };
            this.tappables.push(tappable);
        }
    }

    handleTap(gameSettings: GameSettings, saveGameId: string) {
        // start the game
        this.dispatchEvent(
            new UserEvent(UserEventType.StartGame, gameSettings, saveGameId),
        );
    }

    destroy() {
        for (const d of this.tappables) {
            d.destroy();
        }
        for (const gd of this.gridDisplays) {
            gd.destroy();
        }
        this.tappables = [];
        this.gridDisplays = [];
        this.grids = [];
        this.element.remove();
    }

    rescale() {
        for (const gridDisplay of this.gridDisplays) {
            gridDisplay.rescale();
        }
    }
}
