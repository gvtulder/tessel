import { GameSettings } from "../../game/Game";
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

export class MainMenuDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;
    setupButton: Button;
    grids: Grid[];
    gridDisplays: GridDisplay[];
    tappables: TapHandler[];

    constructor(version?: string) {
        super();

        const div = createElement("div", "screen main-menu");
        this.element = div;

        if (version) {
            const versionDiv = createElement("div", "version", div);
            versionDiv.innerHTML = version;
        }

        const setupButton = new Button(
            icons.pencilIcon,
            "Design a game",
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.SetupMenu));
            },
            "button-setup-menu",
        );
        this.setupButton = setupButton;
        this.element.appendChild(setupButton.element);

        const gameList = document.createElement("div");
        gameList.className = "game-list";
        div.appendChild(gameList);

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
            const poly = shape.constructPolygonForDisplay(0, 0, 1);
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
