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
import { ThreeWayToggle } from "../shared/ThreeWayToggle";
import { Toggles } from "../shared/toggles";
import { msg } from "@lingui/core/macro";
import { StatisticsMonitor } from "../../stats/StatisticsMonitor";
import { StatisticsEvent } from "../../stats/Events";

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
    placeholders: Toggle;
    hints: Toggle;
    highscore: Toggle;

    onTapTile: EventListener;
    onStartDrag: EventListener;
    onGameScore: EventListener;
    onGameEndGame: EventListener;

    constructor(
        game: Game,
        stats?: StatisticsMonitor,
        returnToSetup?: boolean,
    ) {
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

        if (stats) {
            // track game events
            stats.countEvent(StatisticsEvent.GameStarted, game.grid.atlas.id);
            game.addEventListener(GameEventType.Score, (event: GameEvent) => {
                stats.updateHighScore(
                    StatisticsEvent.HighScore,
                    game.points,
                    game.settings.serializedJSON,
                );
                for (const region of event.scoreShapes || []) {
                    if (region.finished) {
                        stats.countEvent(
                            StatisticsEvent.ShapeCompleted,
                            game.settings.serializedJSON,
                        );
                        if (region.tiles) {
                            stats.updateHighScore(
                                StatisticsEvent.ShapeTileCount,
                                region.tiles.size,
                                game.settings.serializedJSON,
                            );
                        }
                    }
                }
            });
            game.addEventListener(
                GameEventType.PlaceTile,
                (event: GameEvent) => {
                    stats.countEvent(
                        StatisticsEvent.TilePlaced,
                        event.tile?.shape?.name.split("-")[0],
                    );
                },
            );
            game.addEventListener(GameEventType.EndGame, () => {
                stats.countEvent(
                    StatisticsEvent.GameCompleted,
                    game.grid.atlas.id,
                );
            });
        }

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
        this.scoreDisplay = new ScoreDisplay(
            stats?.counters.get(`HighScore.${game.settings.serializedJSON}`),
        );
        scoreDisplayContainer.appendChild(this.scoreDisplay.element);
        this.scoreDisplay.points = this.game.points;

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

        const moreTiles = msg({
            id: "ui.menu.addMoreTilesButton",
            message: "More tiles",
        });

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
            this.scoreDisplay.element.classList.toggle(
                "show-highscore",
                this.highscore.checked,
            );
        });
        menu.addToggle(this.highscore);

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
            .getItem("placeholders")
            .then((result) => {
                this.placeholders.checked = result != "no";
            });
        getStorageBackend()
            .getItem("highscore")
            .then((result) => {
                this.highscore.checked = result == "yes";
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
        this.restartgamebutton.destroy();
        this.autorotate.destroy();
        this.hints.destroy();
        this.placeholders.destroy();
        this.highscore.destroy();

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
