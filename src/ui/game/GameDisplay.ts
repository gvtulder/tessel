import { Game, GameEvent, GameEventType } from "../../game/Game.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { ScoreDisplay } from "./ScoreDisplay.js";
import icons from "../icons.js";
import { TileDragController } from "../grid/TileDragController.js";
import { MainGridTileDragController } from "./MainGridTileDragController.js";
import { UserEventType } from "../GameController.js";
import { ScreenDisplay } from "../ScreenDisplay.js";
import { createElement } from "../html.js";
import { Button } from "../Button.js";
import { DropoutMenu } from "./DropoutMenu.js";
import { Toggle } from "./Toggle.js";

export class GameDisplay extends EventTarget implements ScreenDisplay {
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

        const div = (this.element = createElement(
            "div",
            "screen game-display",
        ));

        const divGridContainer = createElement("div", "main-grid", div);
        this.gridDisplay = new MainGridDisplay(
            this.game.grid,
            divGridContainer,
            this,
        );
        divGridContainer.appendChild(this.gridDisplay.element);

        const controlbar = createElement("div", "controls"); // , div);

        createElement("div", "fill", div);
        const tileCounterAndScore = createElement(
            "div",
            "tile-counter-and-score",
            div,
        );

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

        tileCounterAndScore.appendChild(this.tileStackDisplay.counterDiv);

        const scoreDisplayContainer = createElement(
            "div",
            "score-display",
            tileCounterAndScore,
        );
        this.scoreDisplay = new ScoreDisplay();
        scoreDisplayContainer.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        const menu = new DropoutMenu();
        div.appendChild(menu.element);

        const buttons = createElement("div", "buttons", controlbar);

        this.backtomenubutton = new Button(
            icons.houseIcon,
            "Back to menu",
            () => this.dispatchEvent(new Event(UserEventType.BackToMenu)),
        );
        menu.addButton(this.backtomenubutton);

        this.restartgamebutton = new Button(
            icons.rotateLeftIcon,
            "Restart game",
            () => this.dispatchEvent(new Event(UserEventType.RestartGame)),
        );
        menu.addButton(this.restartgamebutton);

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
        menu.addButton(this.autorotate);
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
        menu.addButton(this.hints);
        this.snap = new Toggle(
            icons.magnetIcon,
            "Snap",
            () => {
                tileDragController.snap = this.snap.checked;
                localStorage.setItem("snap", this.snap.checked ? "yes" : "no");
            },
            false,
        );
        menu.addButton(this.snap);

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
