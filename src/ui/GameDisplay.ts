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
    tileDragController : TileDragController;

    element : HTMLDivElement;

    backtomenubutton : Button;
    restartgamebutton : Button;
    autorotate : Toggle;
    hints : Toggle;
    snap : Toggle;

    onTapTile : EventListener;
    onStartDrag : EventListener;
    onGameScore : EventListener;
    onGameEndGame : EventListener;

    constructor(game : Game) {
        super();
        this.game = game;

        this.onTapTile = () =>this.gridDisplay.scoreOverlayDisplay.hide();
        this.onStartDrag = () => this.gridDisplay.scoreOverlayDisplay.hide();
        this.onGameScore = (evt : GameEvent) => {
            this.gridDisplay.scoreOverlayDisplay.showScores(evt.scoreShapes);
            this.scoreDisplay.points = this.game.points;
        };
        this.onGameEndGame = () => this.gridDisplay.gameFinished();

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

        this.backtomenubutton = new Button(
            icons.houseIcon,
            'Back to menu',
            () => this.dispatchEvent(new Event('clickbacktomenu'))
        );
        buttons.appendChild(this.backtomenubutton.element);

        this.restartgamebutton= new Button(
            icons.rotateLeftIcon,
            'Restart game',
            () => this.dispatchEvent(new Event('clickrestartgame'))
        );
        buttons.appendChild(this.restartgamebutton.element);

        const toggles = document.createElement('div');
        toggles.className = 'gameDisplay-toggles';
        controlbar.appendChild(toggles);
        this.autorotate = new Toggle(
            icons.arrowsSpinIcon,
            'Autorotate',
            () => {
                tileDragController.autorotate = this.autorotate.checked;
                localStorage.setItem('autorotate', this.autorotate.checked ? 'yes' : null);
            },
            false
        );
        toggles.appendChild(this.autorotate.element);
        this.hints = new Toggle(
            icons.squareCheckIcon,
            'Show hints',
            () => {
                tileDragController.hints = this.hints.checked;
                localStorage.setItem('hints', this.hints.checked ? 'yes' : null);
            },
            false
        );
        toggles.appendChild(this.hints.element);
        this.snap = new Toggle(
            icons.magnetIcon,
            'Snap',
            () => {
                tileDragController.snap = this.snap.checked;
                localStorage.setItem('snap', this.snap.checked ? 'yes' : null);
            },
            false
        );
        toggles.appendChild(this.snap.element);


        const tileDragController = new TileDragController(this.gridDisplay);
        this.tileStackDisplay.makeDraggable(tileDragController);
        this.tileDragController = tileDragController;

        this.tileStackDisplay.addEventListener(
            TileStackDisplay.events.TapTile, this.onTapTile);
        tileDragController.addEventListener(
            TileDragController.events.StartDrag, this.onTapTile);
        this.game.addEventListener('score', this.onGameScore);
        this.game.addEventListener('endgame', this.onGameEndGame);

        this.autorotate.checked = localStorage.getItem('autorotate') == 'yes';
        this.hints.checked = localStorage.getItem('hints') == 'yes';
        this.snap.checked = localStorage.getItem('snap') == 'yes';

        this.rescale();
    }

    destroy() {
        this.tileStackDisplay.removeEventListener(
            TileStackDisplay.events.TapTile, this.onTapTile);
        this.tileDragController.removeEventListener(
            TileDragController.events.StartDrag, this.onTapTile);
        this.game.removeEventListener('score', this.onGameScore);
        this.game.removeEventListener('endgame', this.onGameEndGame);

        this.backtomenubutton.destroy();
        this.restartgamebutton.destroy();
        this.autorotate.destroy();
        this.hints.destroy();
        this.snap.destroy();

        this.tileStackDisplay.destroy();
        this.scoreDisplay.destroy();
        this.gridDisplay.destroy();
    }

    rescale() {
        this.gridDisplay.rescale();
        this.tileStackDisplay.rescale();
    }
}

class Button {
    element : HTMLElement;
    interactable : Interactable;

    constructor(icon : string, title : string, ontap: (evt : PointerEvent) => void) {
        const button = document.createElement('div');
        button.className = 'game-button';
        button.title = title;
        button.innerHTML = icon;
        this.element = button;
        this.interactable = interact(button).on('tap', ontap);
    }

    destroy() {
        this.interactable.unset();
        this.element.remove();
    }
}

class Toggle {
    static events = {
        Change: 'change',
    };
    element : HTMLElement;
    private _checked : boolean;

    private onchange : () => void;
    private interactable : Interactable;

    constructor(icon : string, title : string, onchange : () => void, checked? : boolean) {

        const toggle = document.createElement('div');
        toggle.className = 'game-toggle';
        toggle.title = title;
        toggle.innerHTML = icon;
        this.element = toggle;

        this.checked = checked ? true : false;
        this.onchange = onchange;

        this.interactable = interact(toggle).on('tap', () => {
            this.toggle();
        });
    }

    destroy() {
        this.interactable.unset();
        this.element.remove();
    }

    get checked() : boolean {
        return this._checked;
    }

    set checked(state : boolean) {
        this.element.classList.toggle('enabled', state);
        if (this._checked != state) {
            this._checked = state;
            if (this.onchange) this.onchange();
        }
    }

    toggle() {
        this.checked = !this.checked;
    }
}
