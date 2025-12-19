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
    tileDragController: MainGridTileDragController;

    element: HTMLDivElement;

    menu: DropoutMenu;
    backtomenubutton: Button;
    restartgamebutton: Button;
    refreshTilesButton: Button;
    addTilesButton: Button;
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

        // tile counter
        this.tileCounterDisplay = new TileCounter(this.game.tileStack);
        this.tileCounterDisplay.tapHandler.onTap = () =>
            this.game.tileStack.reshuffle();
        tileCounterAndScore.appendChild(this.tileCounterDisplay.element);

        // the score display
        const scoreDisplayContainer = createElement(
            "div",
            "score-display",
            tileCounterAndScore,
        );
        this.scoreDisplay = new ScoreDisplay(
            this.game.stats?.counters.get(
                `HighScore.${game.settings.serializedJSON}`,
            ),
        );
        scoreDisplayContainer.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

        // the autoplay button
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
            icons.arrowsRotateIcon,
            msg({ id: "ui.menu.refreshTilesButton", message: "Shuffle tiles" }),
            () => this.game.tileStack.reshuffle(),
            "refreshtiles",
        );
        tileCounterAndScore.appendChild(this.refreshTilesButton.element);

        this.addTilesButton = new Button(
            icons.addTilesIcon,
            msg({ id: "ui.menu.addMoreTilesButton", message: "More tiles" }),
            () => this.game.continue(),
            "addtiles",
        );
        this.tileStackDisplay.element.appendChild(this.addTilesButton.element);

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
                this.scoreDisplay.points = this.game.points;
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
            const n = game.tileStack.tilesLeft - game.tileStack.numberShown;
            this.element.classList.toggle("no-more-tiles", !(n > 0));
        };
        this.listeners.addEventListener(
            game.tileStack,
            GameEventType.UpdateTileCount,
            updateTileCount,
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
        this.autorotate.destroy();
        this.hints.destroy();
        this.placeholders.destroy();
        this.highscore.destroy();

        this.tileCounterDisplay.destroy();
        this.tileDragController.destroy();
        this.tileStackDisplay.destroy();
        this.scoreDisplay.destroy();
        this.gridDisplay.destroy();
    }

    rescale() {
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
