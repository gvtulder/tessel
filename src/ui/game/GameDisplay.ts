/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Game, GameEvent, GameEventType } from "../../game/Game";
import { getStorageBackend } from "../../lib/storage-backend";
import { MainGridDisplay } from "./MainGridDisplay";
import { TileStackDisplay } from "./TileStackDisplay";
import { ScoreDisplay } from "./ScoreDisplay";
import icons from "../shared/icons";
import { TileDragController } from "../grid/TileDragController";
import { MainGridTileDragController } from "./MainGridTileDragController";
import { UserEventType } from "../GameController";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { DropoutMenu } from "./DropoutMenu";
import { Toggle } from "./Toggle";
import { ThreeWayToggle } from "./ThreeWayToggle";
import { setColorScheme } from "../shared/colorScheme";

export class GameDisplay extends EventTarget implements ScreenDisplay {
    game: Game;

    gridDisplay: MainGridDisplay;
    tileStackDisplay: TileStackDisplay;
    scoreDisplay: ScoreDisplay;
    tileDragController: MainGridTileDragController;

    element: HTMLDivElement;

    menu: DropoutMenu;
    backtomenubutton: Button;
    setupbutton: Button;
    restartgamebutton: Button;
    autorotate: Toggle;
    placeholders: Toggle;
    hints: Toggle;
    snap: Toggle;
    colorMode: ThreeWayToggle;

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
        // filler element to add to the bottom/side of the tile stack
        createElement("div", "fill-end", element);

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
        tileCounterAndScore.appendChild(tileStackDisplay.counter.element);

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

        this.setupbutton = new Button(
            icons.swatchbookIcon,
            "Design a game",
            () => this.dispatchEvent(new Event(UserEventType.SetupMenu)),
            "setup",
        );
        menu.addButton(this.setupbutton);

        this.restartgamebutton = new Button(
            icons.rotateLeftIcon,
            "Restart game",
            () => this.dispatchEvent(new Event(UserEventType.RestartGame)),
            "restart",
        );
        menu.addButton(this.restartgamebutton);

        this.placeholders = new Toggle(
            icons.boxIcon,
            "Show placeholders",
            () => {
                this.element.classList.toggle(
                    "hide-placeholders",
                    !this.placeholders.checked,
                );
                getStorageBackend().setItem(
                    "placeholders",
                    this.placeholders.checked ? "yes" : "no",
                );
            },
            false,
        );
        menu.addToggle(this.placeholders);

        this.autorotate = new Toggle(
            icons.arrowsSpinIcon,
            "Autorotate",
            () => {
                tileDragController.autorotate = this.autorotate.checked;
                getStorageBackend().setItem(
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
                getStorageBackend().setItem(
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
                getStorageBackend().setItem(
                    "snap",
                    this.snap.checked ? "yes" : "no",
                );
            },
            false,
        );
        menu.addToggle(this.snap);

        this.colorMode = new ThreeWayToggle(
            icons.sunIcon,
            icons.moonIcon,
            "Light mode",
            "Dark mode",
            "light",
            "dark",
            () => {
                const value = this.colorMode.value;
                if (value) {
                    getStorageBackend().setItem("color-scheme", value);
                } else {
                    getStorageBackend().removeItem("color-scheme");
                }
                setColorScheme();
            },
            null,
        );
        menu.addToggle(this.colorMode);

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
        getStorageBackend()
            .getItem("autorotate")
            .then((result) => {
                this.autorotate.checked = result != "no";
            });
        getStorageBackend()
            .getItem("placeholders")
            .then((result) => {
                this.placeholders.checked = result != "no";
                this.element.classList.toggle(
                    "hide-placeholders",
                    !this.placeholders.checked,
                );
            });
        getStorageBackend()
            .getItem("hints")
            .then((result) => {
                this.hints.checked = result != "no";
            });
        getStorageBackend()
            .getItem("snap")
            .then((result) => {
                this.snap.checked = result != "no";
            });
        getStorageBackend()
            .getItem("color-scheme")
            .then((result) => {
                this.colorMode.value = result;
            });

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
        this.setupbutton.destroy();
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
