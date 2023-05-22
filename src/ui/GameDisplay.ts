import type { Interactable, PointerEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { Game, GameEvent } from "src/game/Game.js";
import { GridDisplay } from "./GridDisplay.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { OrientedColors, Tile } from "src/grid/Tile.js";
import { ScoreDisplay } from "./ScoreDisplay.js";
import icons from './icons.js';

export class GameDisplay extends EventTarget {
    game : Game;

    gridDisplay : MainGridDisplay;
    tileStackDisplay : TileStackDisplay;
    scoreDisplay : ScoreDisplay;

    element : HTMLDivElement;

    constructor(game : Game) {
        super();
        this.game = game;
        this.build();
    }

    build() {
        const div = document.createElement('div');
        div.className = 'gameDisplay';
        this.element = div;

        const divGridContainer = document.createElement('div');
        divGridContainer.className = 'mainGridContainer';
        div.appendChild(divGridContainer);

        this.gridDisplay = new MainGridDisplay(this.game.grid, divGridContainer);
        divGridContainer.appendChild(this.gridDisplay.element);

        const controlbar = document.createElement('div');
        controlbar.className = 'controlbar';
        div.appendChild(controlbar);

        this.scoreDisplay = new ScoreDisplay();
        controlbar.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        this.tileStackDisplay = new TileStackDisplay(this.game.gridType, this.game.tileStack);
        controlbar.appendChild(this.tileStackDisplay.element);

        const buttons = document.createElement('div');
        buttons.className = 'gameDisplay-buttons';
        controlbar.appendChild(buttons);
        buttons.appendChild(this.buildButton(
            icons.houseIcon,
            'Back to menu',
            () => this.dispatchEvent(new Event('clickbacktomenu'))
        ));
        buttons.appendChild(this.buildButton(
            icons.rotateLeftIcon,
            'Restart game',
            () => this.dispatchEvent(new Event('clickrestartgame'))
        ));

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

    buildButton(icon : string, title : string, ontap: (evt : PointerEvent) => void) {
        const button = document.createElement('div');
        button.className = 'game-button';
        button.title = title;
        button.innerHTML = icon;
        interact(button).on('tap', ontap);
        return button;
    }
}
