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
import { MainNavBar, NavBarItems } from "./shared/MainNavBar";
import { AllGamesDisplay } from "./menu/AllGamesDisplay";
import { AboutDisplay } from "./about/AboutDisplay";

export const enum UserEventType {
    StartGame = "startgame",
    BackToMenu = "backtomenu",
    RestartGame = "restartgame",
    AllGamesMenu = "allgames",
    SetupMenu = "setupmenu",
    StartGameFromSetup = "startgamefromsetup",
    Paint = "paint",
    Settings = "settings",
    Statistics = "statistics",
    Navigate = "navigate",
}

export const enum Pages {
    MainMenu = "main",
    AllGames = "all-games",
    SetupMenu = "setup",
    PaintMenu = "paint",
    About = "about",
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

export class NavigateEvent extends Event {
    page?: Pages;

    constructor(page: Pages) {
        super(UserEventType.Navigate);
        this.page = page;
    }
}

export class GameController {
    version?: string;
    workbox?: Workbox;
    container: HTMLElement;
    stats: StatisticsMonitor;
    game?: Game;
    currentScreen?: ScreenDisplay;
    currentScreenDestroy?: null | (() => void);
    restartNeeded?: boolean;
    mainNavBar: MainNavBar;
    destroyMainNavBar: () => void;

    constructor(container: HTMLElement, version?: string, workbox?: Workbox) {
        this.container = container;
        this.version = version;
        this.workbox = workbox;
        this.stats = StatisticsMonitor.instance;

        [this.mainNavBar, this.destroyMainNavBar] = this.buildMainNavBar();
        this.container.appendChild(this.mainNavBar.element);

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

    buildMainNavBar(): [MainNavBar, () => void] {
        const navBar = new MainNavBar();

        const handleNavigate = (evt: NavigateEvent) => {
            this.navigateTo(evt.page!);
        };

        navBar.addEventListener(UserEventType.Navigate, handleNavigate);

        const destroy = () => {
            navBar.removeEventListener(UserEventType.Navigate, handleNavigate);
            navBar.destroy();
        };

        return [navBar, destroy];
    }

    navigateTo(page: Pages | string) {
        if (page == Pages.MainMenu) {
            window.history.pushState({}, "", window.location.pathname);
        } else {
            window.history.pushState({}, "", `#${page}`);
        }
        this.run();
    }

    run() {
        if (this.currentScreenDestroy) {
            this.currentScreenDestroy();
            this.currentScreenDestroy = null;
        }
        const saveGameId = window.location.hash.replace("#", "");
        const gameSettings = SaveGames.lookup.get(saveGameId);
        if (gameSettings) {
            this.startGame(gameSettings);
        } else if (saveGameId == Pages.AllGames) {
            this.showAllGames();
        } else if (saveGameId == Pages.SetupMenu) {
            this.showGameSetupDisplay();
        } else if (saveGameId == Pages.About) {
            this.showAboutDisplay();
        } else if (saveGameId == Pages.Settings) {
            this.showSettingsDisplay();
        } else if (saveGameId == Pages.Statistics) {
            this.showStatisticsDisplay();
        } else if (saveGameId == Pages.PaintMenu) {
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
        this.mainNavBar.show();
        this.mainNavBar.activeTab = NavBarItems.MainMenu;

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

        const destroy = () => {
            menuDisplay.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            menuDisplay.removeEventListener(
                UserEventType.StartGame,
                handleStart,
            );
        };
        this.currentScreenDestroy = destroy;

        menuDisplay.addEventListener(UserEventType.StartGame, handleStart);
    }

    showAllGames() {
        this.resetState();
        this.mainNavBar.show();
        this.mainNavBar.activeTab = NavBarItems.AllGames;

        const allGamesDisplay = new AllGamesDisplay();
        this.currentScreen = allGamesDisplay;
        this.container.appendChild(allGamesDisplay.element);
        allGamesDisplay.rescale();

        const handleStart = (evt: UserEvent) => {
            destroy();
            if (evt.gameId) {
                window.history.pushState({}, "", `#${evt.gameId}`);
            }
            this.startGame(evt.gameSettings!);
        };

        const handleSetup = () => {
            this.navigateTo(Pages.SetupMenu);
        };

        const destroy = () => {
            allGamesDisplay.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            allGamesDisplay.removeEventListener(
                UserEventType.StartGame,
                handleStart,
            );
            allGamesDisplay.removeEventListener(
                UserEventType.SetupMenu,
                handleSetup,
            );
        };
        this.currentScreenDestroy = destroy;

        allGamesDisplay.addEventListener(UserEventType.StartGame, handleStart);
        allGamesDisplay.addEventListener(UserEventType.SetupMenu, handleSetup);
    }

    showAboutDisplay() {
        this.resetState();
        this.mainNavBar.show();
        this.mainNavBar.activeTab = NavBarItems.Settings;

        const handleNavigate = (evt: NavigateEvent) => {
            this.navigateTo(evt.page!);
        };

        const about = new AboutDisplay(this.version);
        this.currentScreen = about;
        this.container.appendChild(about.element);
        about.rescale();

        const destroy = () => {
            about.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            about.removeEventListener(UserEventType.Navigate, handleNavigate);
        };
        this.currentScreenDestroy = destroy;

        about.addEventListener(UserEventType.Navigate, handleNavigate);
    }

    showSettingsDisplay() {
        this.resetState();
        this.mainNavBar.show();
        this.mainNavBar.activeTab = NavBarItems.Settings;

        const handleNavigate = (evt: NavigateEvent) => {
            this.navigateTo(evt.page!);
        };

        const settings = new SettingsDisplay(this.version);
        this.currentScreen = settings;
        this.container.appendChild(settings.element);
        settings.rescale();

        const destroy = () => {
            settings.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            settings.removeEventListener(
                UserEventType.Navigate,
                handleNavigate,
            );
        };
        this.currentScreenDestroy = destroy;

        settings.addEventListener(UserEventType.Navigate, handleNavigate);
    }

    showStatisticsDisplay() {
        this.resetState();
        this.mainNavBar.show();
        this.mainNavBar.activeTab = NavBarItems.Settings;

        const handleNavigate = (evt: NavigateEvent) => {
            this.navigateTo(evt.page!);
        };

        const statistics = new StatisticsDisplay(this.stats);
        this.currentScreen = statistics;
        this.container.appendChild(statistics.element);
        statistics.rescale();

        const destroy = () => {
            statistics.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            statistics.removeEventListener(
                UserEventType.Navigate,
                handleNavigate,
            );
        };
        this.currentScreenDestroy = destroy;

        statistics.addEventListener(UserEventType.Navigate, handleNavigate);
    }

    showGameSetupDisplay() {
        this.resetState();
        this.mainNavBar.hide();
        this.mainNavBar.activeTab = NavBarItems.AllGames;

        const setupDisplay = new GameSetupDisplay();
        this.currentScreen = setupDisplay;
        this.container.appendChild(setupDisplay.element);
        setupDisplay.rescale();

        const handleStart = (evt: UserEvent) => {
            const settings = evt.gameSettingsSerialized!;
            this.navigateTo(btoa(serializedToJSON(settings)));
        };

        const handleBack = () => {
            this.navigateTo(Pages.AllGames);
        };

        const destroy = () => {
            setupDisplay.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            setupDisplay.destroy();
            setupDisplay.removeEventListener(
                UserEventType.StartGameFromSetup,
                handleStart,
            );
            setupDisplay.removeEventListener(
                UserEventType.BackToMenu,
                handleBack,
            );
        };
        this.currentScreenDestroy = destroy;

        setupDisplay.addEventListener(
            UserEventType.StartGameFromSetup,
            handleStart,
        );
        setupDisplay.addEventListener(UserEventType.BackToMenu, handleBack);
    }

    showPaintMenuDisplay() {
        this.resetState();
        this.mainNavBar.show();
        this.mainNavBar.activeTab = NavBarItems.Paint;

        const paintMenu = new PaintMenu();
        this.currentScreen = paintMenu;
        this.container.appendChild(paintMenu.element);
        paintMenu.rescale();

        const handlePaint = (evt: UserEvent) => {
            const atlas = SaveGames.SetupCatalog.atlas.get(evt.gameId || "");
            if (atlas) {
                this.navigateTo(`paint-${atlas.key}`);
            } else {
                this.navigateTo(Pages.MainMenu);
            }
        };

        const destroy = () => {
            paintMenu.element.remove();
            this.currentScreen = undefined;
            this.currentScreenDestroy = undefined;
            paintMenu.removeEventListener(UserEventType.Paint, handlePaint);
        };
        this.currentScreenDestroy = destroy;

        paintMenu.addEventListener(UserEventType.Paint, handlePaint);
    }

    showPaintDisplay(atlas: Atlas) {
        this.resetState();
        this.mainNavBar.hide();
        this.mainNavBar.activeTab = NavBarItems.Paint;

        const grid = new Grid(atlas);

        const paintDisplay = new PaintDisplay(grid);
        this.currentScreen = paintDisplay;
        this.container.appendChild(paintDisplay.element);
        paintDisplay.rescale();

        const handleMenu = () => {
            this.navigateTo(Pages.PaintMenu);
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
        this.mainNavBar.hide();
        this.mainNavBar.activeTab = NavBarItems.AllGames;

        const game = new Game(gameSettings);
        this.game = game;
        const gameDisplay = new GameDisplay(game, this.stats);
        this.currentScreen = gameDisplay;
        this.container.appendChild(gameDisplay.element);
        gameDisplay.rescale();

        // add button handlers
        const handleMenu = () => {
            // TODO return to main menu or all games
            this.navigateTo(Pages.MainMenu);
        };

        const handleSetup = () => {
            this.navigateTo(Pages.SetupMenu);
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
