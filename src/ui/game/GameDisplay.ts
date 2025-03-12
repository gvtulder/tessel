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

    menu: DropoutMenu;
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

        // event handlers
        this.onTapTile = () => this.gridDisplay.scoreOverlayDisplay.hide();
        this.onStartDrag = () => this.gridDisplay.scoreOverlayDisplay.hide();
        this.onGameScore = (evt: GameEvent) => {
            this.gridDisplay.scoreOverlayDisplay.showScores(evt.scoreShapes!);
            this.scoreDisplay.points = this.game.points;
        };
        this.onGameEndGame = () => {
            this.element.classList.add("game-finished");
            this.gridDisplay.gameFinished();
        };

        // main element
        const element = (this.element = createElement(
            "div",
            "screen game-display",
        ));

        // main grid
        const divGridContainer = createElement("div", "main-grid", element);
        const gridDisplay = (this.gridDisplay = new MainGridDisplay(
            this.game.grid,
            divGridContainer,
            this,
        ));
        divGridContainer.appendChild(gridDisplay.element);

        // drag controller for the main grid
        const tileDragController = (this.tileDragController =
            new MainGridTileDragController(this.gridDisplay));

        // filler element for the tile stack and score column
        createElement("div", "fill", element);

        // tile stack
        const tileStackDisplay = (this.tileStackDisplay = new TileStackDisplay(
            this.game.settings.atlas,
            this.game.tileStack,
            tileDragController,
        ));
        element.appendChild(tileStackDisplay.element);

        // tile counter and score segment
        const tileCounterAndScore = createElement(
            "div",
            "tile-counter-and-score",
            element,
        );

        // TODO this should go somewhere else
        // extract the tile count and move it to the counter segment
        tileCounterAndScore.appendChild(tileStackDisplay.counterDiv);

        // the score display
        const scoreDisplayContainer = createElement(
            "div",
            "score-display",
            tileCounterAndScore,
        );
        this.scoreDisplay = new ScoreDisplay();
        scoreDisplayContainer.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        // the controls menu
        const menu = (this.menu = new DropoutMenu());
        element.appendChild(menu.element);

        this.backtomenubutton = new Button(
            icons.houseIcon,
            "Back to menu",
            () => this.dispatchEvent(new Event(UserEventType.BackToMenu)),
            "backtomenu",
        );
        menu.addButton(this.backtomenubutton);

        this.restartgamebutton = new Button(
            icons.rotateLeftIcon,
            "Restart game",
            () => this.dispatchEvent(new Event(UserEventType.RestartGame)),
            "restart",
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
        menu.addToggle(this.autorotate);

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
        menu.addToggle(this.hints);

        this.snap = new Toggle(
            icons.magnetIcon,
            "Snap",
            () => {
                tileDragController.snap = this.snap.checked;
                localStorage.setItem("snap", this.snap.checked ? "yes" : "no");
            },
            false,
        );
        menu.addToggle(this.snap);

        // register event handlers
        tileStackDisplay.addEventListener(
            TileStackDisplay.events.TapTile,
            this.onTapTile,
        );
        tileDragController.addEventListener(
            TileDragController.events.StartDrag,
            this.onStartDrag,
        );
        game.addEventListener(GameEventType.Score, this.onGameScore);
        game.addEventListener(GameEventType.EndGame, this.onGameEndGame);

        // set default settings
        this.autorotate.checked = localStorage.getItem("autorotate") != "no";
        this.hints.checked = localStorage.getItem("hints") != "no";
        this.snap.checked = localStorage.getItem("snap") != "no";

        // initial scaling
        this.rescale();
    }

    destroy() {
        this.element.remove();

        this.tileStackDisplay.removeEventListener(
            TileStackDisplay.events.TapTile,
            this.onTapTile,
        );
        this.tileDragController.removeEventListener(
            TileDragController.events.StartDrag,
            this.onStartDrag,
        );
        this.game.removeEventListener(GameEventType.Score, this.onGameScore);
        this.game.removeEventListener(
            GameEventType.EndGame,
            this.onGameEndGame,
        );

        this.menu.destroy();
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
