import type { Interactable, PointerEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { HexDefault, SquareDefault } from "src/saveGames.js";
import { MainMenuGridDisplay } from "./GridDisplay.js";
import { Grid } from "src/grid/Grid.js";
import { GameSettings } from 'src/game/Game.js';
import { CubeDefault } from '../saveGames.js';


export class MenuEvent extends Event {
    gameSettings : GameSettings;
    constructor(type : string, gameSettings? : GameSettings) {
        super(type);
        this.gameSettings = gameSettings;        
    }
}

export class MainMenuDisplay extends EventTarget {
    element : HTMLDivElement;

    constructor() {
        super();
        this.build();
    }

    build() {
        const div = document.createElement('div');
        div.className = 'mainMenuDisplay';
        this.element = div;

        const gameList = document.createElement('div');
        gameList.className = 'gameList';
        div.appendChild(gameList);

        for (const gameSettings of [SquareDefault, HexDefault, CubeDefault]) {
            const exampleTile = document.createElement('div');
            exampleTile.className = 'gameList-exampleTile';
            gameList.appendChild(exampleTile);

            const grid = new Grid(gameSettings.gridType);
            const gridDisplay = new MainMenuGridDisplay(grid);
            const tile = new gameSettings.gridType.createTile(grid, 0, 0);
            tile.colors = gameSettings.initialTile;
            grid.addTile(tile);
            exampleTile.appendChild(gridDisplay.element);

            gridDisplay.rescaleGrid();

            interact(exampleTile).on('tap', () => {
                this.dispatchEvent(new MenuEvent('startgame', gameSettings));
            }).on('doubletap', (evt : Event) => {
                evt.preventDefault();
            }).on('hold', (evt : Event) => {
                evt.preventDefault();
            });
        }
    }
}
