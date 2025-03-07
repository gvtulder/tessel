import type { Interactable, PointerEvent } from "@interactjs/types";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";

import { Game, GameEvent, GameEventType } from "../game/Game.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { ScoreDisplay } from "./ScoreDisplay.js";
import icons from "./icons.js";
import { TileDragController } from "./TileDragController.js";
import { MainGridTileDragController } from "./MainGridTileDragController.js";
import { UserEventType } from "./GameController.js";
import { createElement } from "./html.js";

export class GameDisplay extends EventTarget {
    game: Game;

    gridDisplay: MainGridDisplay;
    tileStackDisplay: TileStackDisplay;
    scoreDisplay: ScoreDisplay;
    tileDragController: MainGridTileDragController;

    element: HTMLDivElement;

    backtomenubutton: Button;
    restartgamebutton: Button;
    autorotate: Toggle;
    hints: Toggle;
    snap: Toggle;

    onTapTile: EventListener;
    onStartDrag: EventListener;
    onGameScore: EventListener;
    onGameEndGame: EventListener;

    constructor(game: Game) {
        super();
        this.game = game;

        this.onTapTile = () => this.gridDisplay.scoreOverlayDisplay.hide();
        this.onStartDrag = () => this.gridDisplay.scoreOverlayDisplay.hide();
        this.onGameScore = (evt: GameEvent) => {
            this.gridDisplay.scoreOverlayDisplay.showScores(evt.scoreShapes!);
            this.scoreDisplay.points = this.game.points;
        };
        this.onGameEndGame = () => this.gridDisplay.gameFinished();

        const div = (this.element = createElement("div", "gameDisplay"));

        const divGridContainer = createElement("div", "mainGridContainer", div);
        this.gridDisplay = new MainGridDisplay(
            this.game.grid,
            divGridContainer,
            this,
        );
        divGridContainer.appendChild(this.gridDisplay.element);

        const controlbar = createElement("div", "controlbar", div);

        const scoreDisplayContainer = createElement(
            "div",
            "scoreDisplayContainer",
            div,
        );
        this.scoreDisplay = new ScoreDisplay();
        scoreDisplayContainer.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        const tileDragController = new MainGridTileDragController(
            this.gridDisplay,
        );
        this.tileDragController = tileDragController;

        this.tileStackDisplay = new TileStackDisplay(
            this.game.settings.atlas,
            this.game.tileStack,
            tileDragController,
        );
        div.appendChild(this.tileStackDisplay.element);

        const buttons = createElement("div", "gameDisplay-buttons", controlbar);

        this.backtomenubutton = new Button(
            icons.houseIcon,
            "Back to menu",
            () => this.dispatchEvent(new Event(UserEventType.BackToMenu)),
        );
        buttons.appendChild(this.backtomenubutton.element);

        this.restartgamebutton = new Button(
            icons.rotateLeftIcon,
            "Restart game",
            () => this.dispatchEvent(new Event(UserEventType.RestartGame)),
        );
        buttons.appendChild(this.restartgamebutton.element);

        const toggles = createElement("div", "gameDisplay-toggles", controlbar);
        this.autorotate = new Toggle(
            icons.arrowsSpinIcon,
            "Autorotate",
            () => {
                tileDragController.autorotate = this.autorotate.checked;
                localStorage.setItem(
                    "autorotate",
                    this.autorotate.checked ? "yes" : "no",
                );
            },
            false,
        );
        toggles.appendChild(this.autorotate.element);
        this.hints = new Toggle(
            icons.squareCheckIcon,
            "Show hints",
            () => {
                tileDragController.hints = this.hints.checked;
                localStorage.setItem(
                    "hints",
                    this.hints.checked ? "yes" : "no",
                );
            },
            false,
        );
        toggles.appendChild(this.hints.element);
        this.snap = new Toggle(
            icons.magnetIcon,
            "Snap",
            () => {
                tileDragController.snap = this.snap.checked;
                localStorage.setItem("snap", this.snap.checked ? "yes" : "no");
            },
            false,
        );
        toggles.appendChild(this.snap.element);

        this.tileStackDisplay.addEventListener(
            TileStackDisplay.events.TapTile,
            this.onTapTile,
        );
        tileDragController.addEventListener(
            TileDragController.events.StartDrag,
            this.onTapTile,
        );
        this.game.addEventListener(GameEventType.Score, this.onGameScore);
        this.game.addEventListener(GameEventType.EndGame, this.onGameEndGame);

        this.autorotate.checked = localStorage.getItem("autorotate") != "no";
        this.hints.checked = localStorage.getItem("hints") != "no";
        this.snap.checked = localStorage.getItem("snap") != "no";

        this.rescale();
    }

    destroy() {
        this.tileStackDisplay.removeEventListener(
            TileStackDisplay.events.TapTile,
            this.onTapTile,
        );
        this.tileDragController.removeEventListener(
            TileDragController.events.StartDrag,
            this.onTapTile,
        );
        this.game.removeEventListener(GameEventType.Score, this.onGameScore);
        this.game.removeEventListener(
            GameEventType.EndGame,
            this.onGameEndGame,
        );

        this.backtomenubutton.destroy();
        this.restartgamebutton.destroy();
        this.autorotate.destroy();
        this.hints.destroy();
        this.snap.destroy();

        this.tileDragController.destroy();
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
    element: HTMLElement;
    interactable: Interactable;

    constructor(
        icon: string,
        title: string,
        ontap: (evt: PointerEvent) => void,
    ) {
        const button = document.createElement("div");
        button.className = "game-button";
        button.title = title;
        button.innerHTML = icon;
        this.element = button;
        this.interactable = interact(button).on("tap", ontap);
    }

    destroy() {
        this.interactable.unset();
        this.element.remove();
    }
}

class Toggle {
    static events = {
        Change: "change",
    };
    element: HTMLElement;
    private _checked!: boolean;

    private onchange: () => void;
    private interactable: Interactable;

    constructor(
        icon: string,
        title: string,
        onchange: () => void,
        checked?: boolean,
    ) {
        const toggle = document.createElement("div");
        toggle.className = "game-toggle";
        toggle.title = title;
        toggle.innerHTML = icon;
        this.element = toggle;

        this.checked = checked ? true : false;
        this.onchange = onchange;

        this.interactable = interact(toggle).on("tap", () => {
            this.toggle();
        });
    }

    destroy() {
        this.interactable.unset();
        this.element.remove();
    }

    get checked(): boolean {
        return this._checked;
    }

    set checked(state: boolean) {
        this.element.classList.toggle("enabled", state);
        if (this._checked != state) {
            this._checked = state;
            if (this.onchange) this.onchange();
        }
    }

    toggle() {
        this.checked = !this.checked;
    }
}
