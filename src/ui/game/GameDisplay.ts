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
import { UserEventType } from "../shared/UserEvent";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { DropoutMenu } from "./DropoutMenu";
import { Toggle } from "../shared/Toggle";
import { Toggles } from "../shared/toggles";
import { msg } from "@lingui/core/macro";
import { TileCounter } from "./TileCounter";
import { AutoPlayer } from "../../game/autoplayer/AutoPlayer";
import { AnimatedAutoPlayer } from "./AnimatedAutoPlayer";
import { PRNG, seedPRNG } from "../../geom/RandomSampler";
import { DestroyableEventListenerSet } from "../shared/DestroyableEventListenerSet";

export class GameDisplay extends ScreenDisplay {
    game: Game;

    gridDisplay: MainGridDisplay;
    tileStackDisplay: TileStackDisplay;
    tileCounterDisplay: TileCounter;
    scoreDisplay: ScoreDisplay;
    floatingScoreDisplay: ScoreDisplay;
    tileDragController: MainGridTileDragController;

    element: HTMLDivElement;

    menu: DropoutMenu;
    backtomenubutton: Button;
    restartgamebutton: Button;
    refreshTilesButton: Button;
    addTilesButton: Button;
    undoButton: Button;
    redoButton: Button;
    floatingUndoButton: Button;
    floatingRedoButton: Button;
    autorotate: Toggle;
    placeholders: Toggle;
    hints: Toggle;
    highscore: Toggle;

    listeners: DestroyableEventListenerSet;

    constructor(game: Game, returnToSetup?: boolean) {
        super();
        this.game = game;

        this.listeners = new DestroyableEventListenerSet();

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

        // top control bare
        const floatingControls = createElement(
            "div",
            "floating-controls",
            element,
        );

        // tile stack column/row
        const sideContainer = createElement("div", "side-panel", element);

        // tile stack
        const tileStackDisplay = (this.tileStackDisplay = new TileStackDisplay(
            this.game.settings.atlas,
            this.game.tileStack,
            tileDragController,
        ));
        sideContainer.appendChild(tileStackDisplay.element);

        // tile counter
        this.tileCounterDisplay = new TileCounter(this.game.tileStack);
        this.tileCounterDisplay.tapHandler.onTap = () =>
            this.game.rotateTileStack();
        sideContainer.appendChild(this.tileCounterDisplay.element);

        this.floatingScoreDisplay = new ScoreDisplay(
            this.game.stats?.counters.get(
                `HighScore.${game.settings.serializedJSON}`,
            ),
        );
        floatingControls.appendChild(this.floatingScoreDisplay.element);
        this.floatingScoreDisplay.points = this.game.points;

        // the score display
        this.scoreDisplay = new ScoreDisplay(
            this.game.stats?.counters.get(
                `HighScore.${game.settings.serializedJSON}`,
            ),
        );
        sideContainer.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        // the autoplay button
        this.floatingScoreDisplay.onTapAutoPlay =
            this.scoreDisplay.onTapAutoPlay = () => {
                // disable highscores and other statistics
                this.game.stats = undefined;
                new AutoPlayer(this.game).playAllTiles(100);
            };

        // the controls menu
        const menu = (this.menu = new DropoutMenu());
        element.appendChild(menu.element);

        // buttons
        this.backtomenubutton = new Button(
            returnToSetup ? icons.swatchbookIcon : icons.houseIcon,
            msg({ id: "ui.menu.backToMenuButton", message: "Back to menu" }),
            () => this.dispatchEvent(new Event(UserEventType.BackToMenu)),
            "backtomenu",
        );
        menu.addButton(this.backtomenubutton);

        this.restartgamebutton = new Button(
            icons.rotateLeftIcon,
            msg({ id: "ui.menu.restartGameButton", message: "Restart game" }),
            () => this.dispatchEvent(new Event(UserEventType.RestartGame)),
            "restart",
        );
        menu.addButton(this.restartgamebutton);

        this.refreshTilesButton = new Button(
            icons.upDownArrowsIcon,
            msg({ id: "ui.menu.refreshTilesButton", message: "Shuffle tiles" }),
            () => this.game.rotateTileStack(),
            "refreshtiles",
        );
        sideContainer.appendChild(this.refreshTilesButton.element);

        this.addTilesButton = new Button(
            icons.addTilesIcon,
            msg({ id: "ui.menu.addMoreTilesButton", message: "More tiles" }),
            () => this.game.continue(),
            "addtiles",
        );
        this.tileStackDisplay.element.appendChild(this.addTilesButton.element);

        const undo = () => {
            this.gridDisplay.scoreOverlayDisplay.hide();
            this.game.history.undo();
        };
        this.undoButton = new Button(
            icons.undoIcon,
            msg({ id: "ui.menu.undoButton", message: "Undo" }),
            undo,
            "undo",
        );
        sideContainer.appendChild(this.undoButton.element);
        this.floatingUndoButton = new Button(
            icons.undoIcon,
            msg({ id: "ui.menu.undoButton", message: "Undo" }),
            undo,
            "undo",
        );
        floatingControls.appendChild(this.floatingUndoButton.element);

        const redo = () => {
            this.gridDisplay.scoreOverlayDisplay.hide();
            this.game.history.redo();
        };
        this.redoButton = new Button(
            icons.redoIcon,
            msg({ id: "ui.menu.redoButton", message: "Redo" }),
            redo,
            "redo",
        );
        sideContainer.appendChild(this.redoButton.element);
        this.floatingRedoButton = new Button(
            icons.redoIcon,
            msg({ id: "ui.menu.redoButton", message: "Redo" }),
            redo,
            "redo",
        );
        floatingControls.appendChild(this.floatingRedoButton.element);

        // toggles
        this.placeholders = Toggles.Placeholders(() =>
            this.element.classList.toggle(
                "hide-placeholders",
                !this.placeholders.checked,
            ),
        );
        menu.addToggle(this.placeholders);

        this.autorotate = Toggles.Autorotate(
            () => (tileDragController.autorotate = this.autorotate.checked),
        );
        menu.addToggle(this.autorotate);

        this.hints = Toggles.Hints(
            () => (tileDragController.hints = this.hints.checked),
        );
        menu.addToggle(this.hints);

        this.highscore = Toggles.Highscore(() => {
            this.element.classList.toggle(
                "show-highscore",
                this.highscore.checked,
            );
        });
        menu.addToggle(this.highscore);

        // register event handlers
        this.listeners
            .forTarget(tileStackDisplay)
            .addEventListener(TileStackDisplay.events.TapTile, () =>
                this.gridDisplay.scoreOverlayDisplay.hide(),
            );

        this.listeners
            .forTarget(tileDragController)
            .addEventListener(TileDragController.events.StartDrag, () => {
                this.gridDisplay.scoreOverlayDisplay.hide();
                this.element.classList.add("dragging-tile");
            })
            .addEventListener(TileDragController.events.EndDrag, () =>
                this.element.classList.remove("dragging-tile"),
            );

        this.listeners
            .forTarget(game)
            .addEventListener(GameEventType.Score, (evt: GameEvent) => {
                this.gridDisplay.scoreOverlayDisplay.showScores(
                    evt.scoreShapes!,
                );
            })
            .addEventListener(GameEventType.Points, (evt: GameEvent) => {
                this.scoreDisplay.points = this.game.points;
                this.floatingScoreDisplay.points = this.game.points;
            })
            .addEventListener(GameEventType.EndGame, () => {
                this.element.classList.add("game-finished");
                this.gridDisplay.gameFinished();
            })
            .addEventListener(GameEventType.ContinueGame, () => {
                this.element.classList.remove("game-finished");
                this.gridDisplay.gameContinue();
            });

        const updateTileCount = () => {
            const n = game.tileStack.tilesOnStack;
            this.element.classList.toggle("no-more-tiles", !(n > 0));
        };
        this.listeners.addEventListener(
            game.tileStack,
            GameEventType.UpdateTileCount,
            updateTileCount,
        );

        const updateUndoState = () => {
            this.undoButton.element.classList.toggle(
                "disabled",
                !game.history.canUndo,
            );
            this.floatingUndoButton.element.classList.toggle(
                "disabled",
                !game.history.canUndo,
            );
            this.redoButton.element.classList.toggle(
                "disabled",
                !game.history.canRedo,
            );
            this.floatingRedoButton.element.classList.toggle(
                "disabled",
                !game.history.canRedo,
            );
        };
        this.listeners.addEventListener(
            game,
            GameEventType.UpdateCommandHistory,
            updateUndoState,
        );

        // set default settings
        getStorageBackend()
            .getItem("placeholders")
            .then((result) => {
                this.placeholders.checked = result != "no";
            });
        getStorageBackend()
            .getItem("highscore")
            .then((result) => {
                this.highscore.checked = result == "yes";
            });

        // if this is a restored game, it might be already finished
        if (this.game.tileStack.tilesLeft == 0) {
            this.element.classList.add("game-finished");
            this.gridDisplay.gameFinished(true);
        }
        updateTileCount();

        // initial scaling
        this.rescale();
    }

    handleBackButton(): boolean {
        if (this.game.tileStack.tilesLeft == 0) return true;
        if (this.element.classList.contains("game-finished")) return true;
        if (this.menu.recentlyExpanded) return true;
        this.menu.expand();
        return false;
    }

    destroy() {
        this.element.remove();
        this.listeners.removeAll();

        this.menu.destroy();
        this.backtomenubutton.destroy();
        this.restartgamebutton.destroy();
        this.refreshTilesButton.destroy();
        this.addTilesButton.destroy();
        this.undoButton.destroy();
        this.redoButton.destroy();
        this.floatingUndoButton.destroy();
        this.floatingRedoButton.destroy();
        this.autorotate.destroy();
        this.hints.destroy();
        this.placeholders.destroy();
        this.highscore.destroy();

        this.tileCounterDisplay.destroy();
        this.tileDragController.destroy();
        this.tileStackDisplay.destroy();
        this.scoreDisplay.destroy();
        this.floatingScoreDisplay.destroy();
        this.gridDisplay.destroy();
    }

    rescale() {
        if (window.matchMedia) {
            const topFloatingControls = window.matchMedia(
                "(max-aspect-ratio: 3 / 5)",
            );
            if (topFloatingControls.matches) {
                this.gridDisplay.margins.top =
                    30 +
                    this.floatingScoreDisplay.element.getBoundingClientRect()
                        .height;
            } else {
                this.gridDisplay.margins.top = 30;
            }
            const leftFloatingControls = window.matchMedia(
                "(min-aspect-ratio: 5 / 3)",
            );
            if (leftFloatingControls.matches) {
                this.gridDisplay.margins.left =
                    30 +
                    this.floatingScoreDisplay.element.getBoundingClientRect()
                        .width;
            } else {
                this.gridDisplay.margins.left = 30;
            }
        }
        this.gridDisplay.rescale();
        this.tileStackDisplay.rescale();
    }

    getAutoPlayer(): AutoPlayer {
        return new AutoPlayer(this.game);
    }

    getAnimatedAutoPlayer(prngSeed?: number, prng?: PRNG): AnimatedAutoPlayer {
        if (prngSeed) prng = seedPRNG(prngSeed);
        return new AnimatedAutoPlayer(
            this,
            undefined,
            undefined,
            undefined,
            undefined,
            prng,
        );
    }
}
