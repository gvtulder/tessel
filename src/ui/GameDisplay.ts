import { Game, GameEvent } from "src/game/Game.js";
import { GridDisplay } from "./GridDisplay.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { OrientedColors, Tile } from "src/grid/Tile.js";
import { ScoreDisplay } from "./ScoreDisplay.js";

export class GameDisplay {
    game : Game;

    gridDisplay : MainGridDisplay;
    tileStackDisplay : TileStackDisplay;
    scoreDisplay : ScoreDisplay;

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

        const controlbar = document.createElement('div');
        controlbar.className = 'controlbar';
        div.appendChild(controlbar);

        this.scoreDisplay = new ScoreDisplay();
        controlbar.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        this.tileStackDisplay = new TileStackDisplay(this.game.gridType, this.game.tileStack);
        controlbar.appendChild(this.tileStackDisplay.element);

        this.tileStackDisplay.makeDraggable(this.gridDisplay, () => {
            this.gridDisplay.scoreOverlayDisplay.hide();
        });
        this.gridDisplay.makeDroppable((target : Tile, orientedColors : OrientedColors, indexOnStack : number) => {
            return this.game.placeFromStack(target, orientedColors, indexOnStack);
        });

        this.game.addEventListener('score', (evt : GameEvent) => {
            this.gridDisplay.scoreOverlayDisplay.showScores(evt.scoreShapes);
            this.scoreDisplay.points = this.game.points;
        });

        this.game.addEventListener('endgame', () => {
            this.gridDisplay.gameFinished();
        });
    }
}
