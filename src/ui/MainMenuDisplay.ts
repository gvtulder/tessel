import type { Interactable } from "@interactjs/types";
import interact from "interactjs";

import { GameSettings } from "../game/Game";
import { Grid } from "../geom/Grid";
import { GridDisplay, MainMenuGridDisplay } from "./GridDisplay";
import * as SaveGames from "../saveGames";
import { TileType } from "../geom/Tile";

export class MenuEvent extends Event {
    gameSettings: GameSettings;
    gameId: string;
    constructor(type: string, gameSettings?: GameSettings, gameId?: string) {
        super(type);
        this.gameSettings = gameSettings;
        this.gameId = gameId;
    }
}

export class MainMenuDisplay extends EventTarget {
    element: HTMLDivElement;
    grids: Grid[];
    gridDisplays: GridDisplay[];
    interactables: Interactable[];

    constructor() {
        super();
        this.build();
    }

    build() {
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
                            new MenuEvent(
                                "startgame",
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
        for (const grid of this.grids) {
            grid.destroy();
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
