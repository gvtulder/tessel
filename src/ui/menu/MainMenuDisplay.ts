import type { Interactable } from "@interactjs/types";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";

import { GameSettings } from "../../game/Game";
import { Grid } from "../../geom/Grid";
import { GridDisplay } from "../grid/GridDisplay";
import { MainMenuGridDisplay } from "./MainMenuGridDisplay";
import * as SaveGames from "../../saveGames";
import { UserEvent, UserEventType } from "../GameController";
import { ScreenDisplay } from "../ScreenDisplay";

export class MainMenuDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;
    grids: Grid[];
    gridDisplays: GridDisplay[];
    interactables: Interactable[];

    constructor() {
        super();

        const div = document.createElement("div");
        div.className = "mainMenuDisplay";
        this.element = div;

        const gameList = document.createElement("div");
        gameList.className = "gameList";
        div.appendChild(gameList);

        this.grids = [];
        this.gridDisplays = [];
        this.interactables = [];

        for (const saveGameId of SaveGames.defaultGameList) {
            const gameSettings = SaveGames.lookup.get(saveGameId);
            if (!gameSettings) continue;

            const exampleTile = document.createElement("div");
            exampleTile.className = "gameList-exampleTile";
            gameList.appendChild(exampleTile);

            const grid = new Grid(gameSettings.atlas);
            const shape = grid.atlas.shapes[0];
            const poly = shape.constructPolygonXYR(0, 0, 1);
            const tile = grid.addTile(shape, poly, poly.segment());
            tile.colors = gameSettings.initialTile;

            this.grids.push(grid);

            const gridDisplay = new MainMenuGridDisplay(grid, exampleTile);
            this.gridDisplays.push(gridDisplay);
            exampleTile.appendChild(gridDisplay.element);

            this.interactables.push(
                interact(exampleTile)
                    .on("tap", () => {
                        this.dispatchEvent(
                            new UserEvent(
                                UserEventType.StartGame,
                                gameSettings,
                                saveGameId,
                            ),
                        );
                    })
                    .on("doubletap", (evt: Event) => {
                        evt.preventDefault();
                    })
                    .on("hold", (evt: Event) => {
                        evt.preventDefault();
                    }),
            );
        }
    }

    destroy() {
        for (const i of this.interactables) {
            i.unset();
        }
        for (const gd of this.gridDisplays) {
            gd.destroy();
        }
        this.interactables = [];
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
