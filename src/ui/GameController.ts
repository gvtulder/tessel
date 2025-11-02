/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import {
    Game,
    GameEvent,
    GameEventType,
    gameFromSerializedSettings,
    GameSettings,
    GameSettingsSerialized,
    serializedToJSON,
} from "../game/Game";
import { GameDisplay } from "./game/GameDisplay";
import { MainMenuDisplay } from "./menu/MainMenuDisplay";
import * as SaveGames from "../saveGames";
import { GameSetupDisplay } from "./setup/GameSetupDisplay";
import { ScreenDisplay } from "./shared/ScreenDisplay";
import { Workbox } from "workbox-window";
import { PaintDisplay } from "./paint/PaintDisplay";
import { Grid } from "../grid/Grid";
import { Atlas } from "../grid/Atlas";
import { PaintMenu } from "./paint/PaintMenu";
import { SettingsDisplay } from "./settings/SettingsDisplay";
import { StatisticsDisplay } from "./statistics/StatisticsDisplay";
import { StatisticsMonitor } from "../stats/StatisticsMonitor";
import { StatisticsEvent } from "../stats/Events";

export const enum UserEventType {
    StartGame = "startgame",
    BackToMenu = "backtomenu",
    RestartGame = "restartgame",
    SetupMenu = "setupmenu",
    StartGameFromSetup = "startgamefromsetup",
    Paint = "paint",
    Settings = "settings",
    Statistics = "statistics",
}

export class UserEvent extends Event {
    gameSettings?: GameSettings;
    gameId?: string;
    gameSettingsSerialized?: GameSettingsSerialized;

    constructor(
        type: UserEventType,
        gameSettings?: GameSettings,
        gameId?: string,
        gameSettingsSerialized?: GameSettingsSerialized,
    ) {
        super(type);
        this.gameSettings = gameSettings;
        this.gameId = gameId;
        this.gameSettingsSerialized = gameSettingsSerialized;
    }
}

export class GameController {
    version?: string;
    workbox?: Workbox;
    container: HTMLElement;
    stats: StatisticsMonitor;
    game?: Game;
    currentScreen?: ScreenDisplay;
    currentScreenDestroy?: () => void;
    restartNeeded?: boolean;

    constructor(container: HTMLElement, version?: string, workbox?: Workbox) {
        this.container = container;
        this.version = version;
        this.workbox = workbox;
        this.stats = StatisticsMonitor.instance;

        const rescale = () => this.rescale();
        if (screen && screen.orientation) {
            screen.orientation.addEventListener("change", rescale);
        }
        window.addEventListener("resize", () => {
            rescale();
            // iOS Safari sometimes doesn't immediately update the sizes
            window.setTimeout(rescale, 50);
        });
        window.addEventListener("popstate", (evt: PopStateEvent) => {
            this.run();
        });

        if (this.workbox) {
            const wb = this.workbox;
            wb.addEventListener("waiting", () => {
                wb.addEventListener("controlling", () => {
                    console.log(
                        "New service worker controlling. Scheduling reload.",
                    );
                    this.restartNeeded = true;
                });
                console.log("A service worker is waiting.");
                wb.messageSkipWaiting();
            });
        }
    }

    run() {
        const saveGameId = window.location.hash.replace("#", "");
        const gameSettings = SaveGames.lookup.get(saveGameId);
        if (gameSettings) {
            this.startGame(gameSettings);
        } else if (saveGameId == "setup") {
            this.showGameSetupDisplay();
        } else if (saveGameId == "settings") {
            this.showSettingsDisplay();
        } else if (saveGameId == "statistics") {
            this.showStatisticsDisplay();
        } else if (saveGameId == "paint") {
            this.showPaintMenuDisplay();
        } else if (saveGameId.match("^paint-")) {
            const key = saveGameId.split("-")[1];
            const atlas = SaveGames.SetupCatalog.atlas.get(key);
            if (atlas) {
                this.showPaintDisplay(atlas.atlas);
            } else {
                this.showPaintMenuDisplay();
            }
        } else {
            let gameSettings: GameSettings | null = null;
            try {
                const serialized = JSON.parse(atob(saveGameId));
                gameSettings = this.gameFromSerializedSettings(serialized);
            } catch {
                gameSettings = null;
            }
            if (gameSettings) {
                this.startGame(gameSettings);
            } else {
                this.showMainMenu();
            }
        }
    }

    checkForUpdate(): boolean {
        console.log("Checking for updates.");

        if (this.restartNeeded) {
            console.log("Reloading to install update.");
            window.location.reload();
            return true;
        }

        if (this.workbox) {
            console.log("Checking for service worker update.");
            this.workbox.update();
        }
        return false;
    }

    showMainMenu() {
        this.resetState();

        if (this.checkForUpdate()) return;

        const menuDisplay = new MainMenuDisplay(this.version);
        this.currentScreen = menuDisplay;
        this.container.appendChild(menuDisplay.element);
        menuDisplay.rescale();

        const handleStart = (evt: UserEvent) => {
            destroy();
            if (evt.gameId) {
                window.history.pushState({}, "", `#${evt.gameId}`);
            }
            this.startGame(evt.gameSettings!);
        };

        const handleSetup = () => {
            destroy();
            window.history.pushState({}, "", `#setup`);
            this.showGameSetupDisplay();
        };

        const handleSettings = () => {
            destroy();
            window.history.pushState({}, "", `#settings`);
            this.showSettingsDisplay();
        };

        const handleStatistics = () => {
            destroy();
            window.history.pushState({}, "", `#statistics`);
            this.showStatisticsDisplay();
        };

        const handlePaintMenu = () => {
            destroy();
            window.history.pushState({}, "", `#paint`);
            this.showPaintMenuDisplay();
        };

        const destroy = () => {
            menuDisplay.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            menuDisplay.removeEventListener(
                UserEventType.StartGame,
                handleStart,
            );
            menuDisplay.removeEventListener(
                UserEventType.SetupMenu,
                handleSetup,
            );
            menuDisplay.removeEventListener(
                UserEventType.Settings,
                handleSettings,
            );
            menuDisplay.removeEventListener(
                UserEventType.Statistics,
                handleStatistics,
            );
            menuDisplay.removeEventListener(
                UserEventType.Paint,
                handlePaintMenu,
            );
        };
        this.currentScreenDestroy = destroy;

        menuDisplay.addEventListener(UserEventType.StartGame, handleStart);
        menuDisplay.addEventListener(UserEventType.SetupMenu, handleSetup);
        menuDisplay.addEventListener(UserEventType.Settings, handleSettings);
        menuDisplay.addEventListener(
            UserEventType.Statistics,
            handleStatistics,
        );
        menuDisplay.addEventListener(UserEventType.Paint, handlePaintMenu);
    }

    showSettingsDisplay() {
        this.resetState();

        const settings = new SettingsDisplay(this.version);
        this.currentScreen = settings;
        this.container.appendChild(settings.element);
        settings.rescale();

        const handleMenu = () => {
            destroy();
            window.history.pushState({}, "", window.location.pathname);
            this.showMainMenu();
        };

        const handleSettings = () => {
            destroy();
            window.history.pushState({}, "", `#settings`);
            this.showSettingsDisplay();
        };

        const destroy = () => {
            settings.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            settings.removeEventListener(UserEventType.BackToMenu, handleMenu);
            settings.removeEventListener(
                UserEventType.Settings,
                handleSettings,
            );
        };
        this.currentScreenDestroy = destroy;

        settings.addEventListener(UserEventType.BackToMenu, handleMenu);
        settings.addEventListener(UserEventType.Settings, handleSettings);
    }

    showStatisticsDisplay() {
        this.resetState();

        const statistics = new StatisticsDisplay(this.stats);
        this.currentScreen = statistics;
        this.container.appendChild(statistics.element);
        statistics.rescale();

        const handleMenu = () => {
            destroy();
            window.history.pushState({}, "", window.location.pathname);
            this.showMainMenu();
        };

        const destroy = () => {
            statistics.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            statistics.removeEventListener(
                UserEventType.BackToMenu,
                handleMenu,
            );
        };
        this.currentScreenDestroy = destroy;

        statistics.addEventListener(UserEventType.BackToMenu, handleMenu);
    }

    showGameSetupDisplay() {
        this.resetState();

        const setupDisplay = new GameSetupDisplay();
        this.currentScreen = setupDisplay;
        this.container.appendChild(setupDisplay.element);
        setupDisplay.rescale();

        const handleBackToMenu = (evt: UserEvent) => {
            destroy();
            window.history.pushState({}, "", window.location.pathname);
            this.showMainMenu();
        };

        const handleStart = (evt: UserEvent) => {
            const settings = evt.gameSettingsSerialized!;
            console.log("Clicked play to start", settings);
            destroy();
            window.history.pushState(
                {},
                "",
                `#${btoa(serializedToJSON(settings))}`,
            );
            const gameSettings = this.gameFromSerializedSettings(settings);
            if (gameSettings) this.startGame(gameSettings);
        };

        const destroy = () => {
            setupDisplay.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            setupDisplay.destroy();
            setupDisplay.removeEventListener(
                UserEventType.BackToMenu,
                handleBackToMenu,
            );
            setupDisplay.removeEventListener(
                UserEventType.StartGameFromSetup,
                handleStart,
            );
        };
        this.currentScreenDestroy = destroy;

        setupDisplay.addEventListener(
            UserEventType.BackToMenu,
            handleBackToMenu,
        );
        setupDisplay.addEventListener(
            UserEventType.StartGameFromSetup,
            handleStart,
        );
    }

    showPaintMenuDisplay() {
        this.resetState();

        const paintMenu = new PaintMenu();
        this.currentScreen = paintMenu;
        this.container.appendChild(paintMenu.element);
        paintMenu.rescale();

        const handleMenu = () => {
            destroy();
            window.history.pushState({}, "", window.location.pathname);
            this.showMainMenu();
        };

        const handlePaint = (evt: UserEvent) => {
            destroy();
            const atlas = SaveGames.SetupCatalog.atlas.get(evt.gameId || "");
            if (atlas) {
                window.history.pushState({}, "", `#paint-${atlas.key}`);
                this.showPaintDisplay(atlas.atlas);
            } else {
                window.history.pushState({}, "", window.location.pathname);
                this.showMainMenu();
            }
        };

        const destroy = () => {
            paintMenu.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            paintMenu.removeEventListener(UserEventType.BackToMenu, handleMenu);
            paintMenu.removeEventListener(UserEventType.Paint, handlePaint);
        };
        this.currentScreenDestroy = destroy;

        paintMenu.addEventListener(UserEventType.BackToMenu, handleMenu);
        paintMenu.addEventListener(UserEventType.Paint, handlePaint);
    }

    showPaintDisplay(atlas: Atlas) {
        this.resetState();

        const grid = new Grid(atlas);

        const paintDisplay = new PaintDisplay(grid);
        this.currentScreen = paintDisplay;
        this.container.appendChild(paintDisplay.element);
        paintDisplay.rescale();

        const handleMenu = () => {
            destroy();
            window.history.pushState({}, "", window.location.pathname);
            this.showMainMenu();
        };

        const destroy = () => {
            paintDisplay.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            paintDisplay.removeEventListener(
                UserEventType.BackToMenu,
                handleMenu,
            );
        };
        this.currentScreenDestroy = destroy;

        paintDisplay.addEventListener(UserEventType.BackToMenu, handleMenu);
    }

    gameFromSerializedSettings(
        serialized: GameSettingsSerialized,
    ): GameSettings | null {
        return gameFromSerializedSettings(SaveGames.SetupCatalog, serialized);
    }

    startGame(gameSettings: GameSettings) {
        this.resetState();

        const game = new Game(gameSettings);
        this.game = game;
        const gameDisplay = new GameDisplay(game);
        this.currentScreen = gameDisplay;
        this.container.appendChild(gameDisplay.element);
        gameDisplay.rescale();

        // track game events
        this.stats.countEvent(StatisticsEvent.GameStarted, game.grid.atlas.id);
        game.addEventListener(GameEventType.Score, (event: GameEvent) => {
            this.stats.updateHighScore(
                StatisticsEvent.HighScore,
                game.points,
                game.settings.serializedJSON,
            );
            for (const region of event.scoreShapes || []) {
                if (region.finished) {
                    this.stats.countEvent(
                        StatisticsEvent.ShapeCompleted,
                        game.settings.serializedJSON,
                    );
                    if (region.tiles) {
                        this.stats.updateHighScore(
                            StatisticsEvent.ShapeTileCount,
                            region.tiles.size,
                            game.settings.serializedJSON,
                        );
                    }
                }
            }
        });
        game.addEventListener(GameEventType.PlaceTile, (event: GameEvent) => {
            this.stats.countEvent(
                StatisticsEvent.TilePlaced,
                event.tile?.shape?.name.split("-")[0],
            );
        });
        game.addEventListener(GameEventType.EndGame, () => {
            this.stats.countEvent(
                StatisticsEvent.GameCompleted,
                game.grid.atlas.id,
            );
        });

        // add button handlers
        const handleMenu = () => {
            destroy();
            window.history.pushState({}, "", window.location.pathname);
            this.showMainMenu();
        };

        const handleSetup = () => {
            destroy();
            window.history.pushState({}, "", `#setup`);
            this.showGameSetupDisplay();
        };

        const handleRestart = () => {
            destroy();
            this.startGame(gameSettings);
        };

        const destroy = () => {
            this.currentScreenDestroy = undefined;
            gameDisplay.removeEventListener(
                UserEventType.BackToMenu,
                handleMenu,
            );
            gameDisplay.removeEventListener(
                UserEventType.SetupMenu,
                handleSetup,
            );
            gameDisplay.removeEventListener(
                UserEventType.RestartGame,
                handleRestart,
            );
        };
        this.currentScreenDestroy = destroy;

        gameDisplay.addEventListener(UserEventType.BackToMenu, handleMenu);
        gameDisplay.addEventListener(UserEventType.SetupMenu, handleSetup);
        gameDisplay.addEventListener(UserEventType.RestartGame, handleRestart);
    }

    resetState() {
        if (this.currentScreen) {
            const oldDestroy = this.currentScreenDestroy;
            this.currentScreenDestroy = undefined;
            const screen = this.currentScreen;
            this.currentScreen = undefined;
            screen.element.classList.add("disappear");
            window.setTimeout(() => {
                screen.element.remove();
                screen.destroy();
                if (oldDestroy) oldDestroy();
            }, 1000);
        }
    }

    rescale() {
        if (this.currentScreen) {
            this.currentScreen.rescale();
        }
    }
}
