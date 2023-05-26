import type { Interactable, PointerEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { Game, GameEvent } from "src/game/Game.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { ScoreDisplay } from "./ScoreDisplay.js";
import icons from './icons.js';
import { TileDragController } from './TileDragController.js';

export class GameDisplay extends EventTarget {
    game : Game;

    gridDisplay : MainGridDisplay;
    tileStackDisplay : TileStackDisplay;
    scoreDisplay : ScoreDisplay;

    element : HTMLDivElement;

    autorotate : Toggle;
    hints : Toggle;

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

        this.gridDisplay = new MainGridDisplay(this.game.grid, divGridContainer, this);
        divGridContainer.appendChild(this.gridDisplay.element);

        const controlbar = document.createElement('div');
        controlbar.className = 'controlbar';
        div.appendChild(controlbar);

        this.scoreDisplay = new ScoreDisplay();
        controlbar.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        this.tileStackDisplay = new TileStackDisplay(this.game.pattern, this.game.tileStack);
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

        const toggles = document.createElement('div');
        toggles.className = 'gameDisplay-toggles';
        controlbar.appendChild(toggles);
        this.autorotate = new Toggle(
            icons.arrowsSpinIcon,
            'Autorotate',
            false
        );
        toggles.appendChild(this.autorotate.element);
        this.hints = new Toggle(
            icons.squareCheckIcon,
            'Show hints',
            false
        );
        toggles.appendChild(this.hints.element);


        const tileDragController = new TileDragController(this.gridDisplay);
        this.tileStackDisplay.makeDraggable(tileDragController);

        this.tileStackDisplay.addEventListener(TileStackDisplay.events.TapTile,
            () =>this.gridDisplay.scoreOverlayDisplay.hide()
        );

        tileDragController.addEventListener(TileDragController.events.StartDrag,
            () =>this.gridDisplay.scoreOverlayDisplay.hide()
        );

        this.game.addEventListener('score', (evt : GameEvent) => {
            this.gridDisplay.scoreOverlayDisplay.showScores(evt.scoreShapes);
            this.scoreDisplay.points = this.game.points;
        });

        this.game.addEventListener('endgame', () => {
            this.gridDisplay.gameFinished();
        });

        this.autorotate.addEventListener(Toggle.events.Change, () => {
            tileDragController.autorotate = this.autorotate.checked;
            localStorage.setItem('autorotate', this.autorotate.checked ? 'yes' : null);
        });
        this.autorotate.checked = localStorage.getItem('autorotate') == 'yes';
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

class Toggle extends EventTarget {
    static events = {
        Change: 'change',
    };
    element : HTMLElement;
    private _checked : boolean;

    constructor(icon : string, title : string, checked? : boolean) {
        super();

        const toggle = document.createElement('div');
        toggle.className = 'game-toggle';
        toggle.title = title;
        toggle.innerHTML = icon;
        this.element = toggle;

        this.checked = checked ? true : false;

        interact(toggle).on('tap', () => {
            this.toggle();
        });
    }

    get checked() : boolean {
        return this._checked;
    }

    set checked(state : boolean) {
        this.element.classList.toggle('enabled', state);
        if (this._checked != state) {
            this._checked = state;
            console.log(state, this, this.checked);
            this.dispatchEvent(new Event(Toggle.events.Change));
        }
    }

    toggle() {
        this.checked = !this.checked;
    }
}
