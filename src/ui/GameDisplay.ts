import { Game } from "src/game/Game.js";
import { GridDisplay, MainGridDisplay } from "./GridDisplay.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { OrientedColors, Tile } from "src/grid/Tile.js";

export class GameDisplay {
    game : Game;

    gridDisplay : MainGridDisplay;
    tileStackDisplay : TileStackDisplay;

    element : HTMLDivElement;

    constructor(game : Game) {
        this.game = game;
        this.build();
    }

    build() {
        const div = document.createElement('div');
        div.className = 'gameDisplay';
        this.element = div;

        this.gridDisplay = new MainGridDisplay(this.game.grid);
        div.appendChild(this.gridDisplay.element);

        this.tileStackDisplay = new TileStackDisplay(this.game.gridType, this.game.tileStack);
        div.appendChild(this.tileStackDisplay.element);

        this.tileStackDisplay.makeDraggable(this.gridDisplay);
        this.gridDisplay.makeDroppable((target : Tile, orientedColors : OrientedColors, indexOnStack : number) => {
            return this.game.placeFromStack(target, orientedColors, indexOnStack);
        });
    }
}
