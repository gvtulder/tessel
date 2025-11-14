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
import {
    NavigateEvent,
    Pages,
    UserEvent,
    UserEventType,
} from "./shared/UserEvent";

export class GameController {
    version?: string;
    workbox?: Workbox;
    container: HTMLElement;
    stats: StatisticsMonitor;
    game?: Game;
    currentScreen?: ScreenDisplay;
    currentScreenDestroy?: null | (() => void);
    previousScreenDestroy?: null | (() => void);
    previousScreenDestroyTimeout?: number;
    restartNeeded?: boolean;
    mainNavBar: MainNavBar;
    lastNavBarItem?: NavBarItems | null;
    lastMainPage?: Pages;
    lastSettingsTab?: Pages;
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
            let page = evt.page!;
            if (page == Pages.Settings) {
                // return to previous tab
                page = this.lastSettingsTab || Pages.Settings;
            }
            this.navigateTo(page);
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
                this.showPaintDisplay(atlas.atlas, saveGameId);
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

    showScreen(
        screen: ScreenDisplay,
        mainNavBarTab?: NavBarItems,
        lastMainPage?: Pages,
        lastSettingsTab?: Pages,
        handlers?: [UserEventType, () => void][],
    ) {
        if (this.lastNavBarItem != mainNavBarTab) {
            window.setTimeout(() => {
                screen.element.classList.remove("appear", "appear-initial");
            }, 1000);
            screen.element.classList.add("appear");
            if (!this.lastNavBarItem) {
                screen.element.classList.add("appear-initial");
            }
        }

        this.resetState();
        if (mainNavBarTab) {
            this.mainNavBar.show();
            this.mainNavBar.activeTab = mainNavBarTab;
            this.lastNavBarItem = mainNavBarTab;
        } else {
            this.mainNavBar.hide();
            this.lastNavBarItem = null;
        }
        if (lastMainPage) {
            this.lastMainPage = lastMainPage;
        }
        if (lastSettingsTab) {
            this.lastSettingsTab = lastSettingsTab;
        }

        const handleNavigate = (evt: NavigateEvent) => {
            this.navigateTo(evt.page!);
        };

        const handleBack = () => {
            this.navigateTo(this.lastMainPage || Pages.MainMenu);
        };

        const handleRestart = () => {
            this.run();
        };

        const handleStartGame = (evt: UserEvent) => {
            if (evt.gameSettingsSerialized) {
                const settings = evt.gameSettingsSerialized!;
                this.navigateTo(btoa(serializedToJSON(settings)));
            } else {
                if (evt.gameId) {
                    window.history.pushState({}, "", `#${evt.gameId}`);
                }
                this.startGame(evt.gameSettings!);
            }
        };

        this.currentScreen = screen;
        this.container.appendChild(screen.element);
        screen.rescale();

        const destroy = () => {
            screen.element.remove();
            screen.removeEventListener(UserEventType.Navigate, handleNavigate);
            screen.removeEventListener(UserEventType.BackToMenu, handleBack);
            screen.removeEventListener(
                UserEventType.RestartGame,
                handleRestart,
            );
            screen.removeEventListener(
                UserEventType.StartGame,
                handleStartGame,
            );
            for (const [eventType, handler] of handlers || []) {
                screen.removeEventListener(eventType, handler);
            }
        };
        this.currentScreenDestroy = destroy;

        screen.addEventListener(UserEventType.Navigate, handleNavigate);
        screen.addEventListener(UserEventType.BackToMenu, handleBack);
        screen.addEventListener(UserEventType.RestartGame, handleRestart);
        screen.addEventListener(UserEventType.StartGame, handleStartGame);
        for (const [eventType, handler] of handlers || []) {
            screen.addEventListener(eventType, handler);
        }
    }

    showMainMenu() {
        if (this.checkForUpdate()) return;
        this.showScreen(
            new MainMenuDisplay(this.version),
            NavBarItems.MainMenu,
            Pages.MainMenu,
        );
    }

    showAllGames() {
        this.showScreen(
            new AllGamesDisplay(),
            NavBarItems.AllGames,
            Pages.AllGames,
        );
    }

    showAboutDisplay() {
        this.showScreen(
            new AboutDisplay(this.version),
            NavBarItems.Settings,
            Pages.About,
            Pages.About,
        );
    }

    showSettingsDisplay() {
        this.showScreen(
            new SettingsDisplay(this.version),
            NavBarItems.Settings,
            Pages.Settings,
            Pages.Settings,
        );
    }

    showStatisticsDisplay() {
        this.showScreen(
            new StatisticsDisplay(this.stats),
            NavBarItems.Settings,
            Pages.Statistics,
            Pages.Statistics,
        );
    }

    showGameSetupDisplay() {
        this.showScreen(new GameSetupDisplay(), undefined, Pages.SetupMenu);
    }

    showPaintMenuDisplay() {
        this.showScreen(new PaintMenu(), NavBarItems.Paint, Pages.PaintMenu);
    }

    showPaintDisplay(atlas: Atlas, page: string) {
        const grid = new Grid(atlas);
        const paintDisplay = new PaintDisplay(grid);
        this.showScreen(paintDisplay);
    }

    gameFromSerializedSettings(
        serialized: GameSettingsSerialized,
    ): GameSettings | null {
        return gameFromSerializedSettings(SaveGames.SetupCatalog, serialized);
    }

    startGame(gameSettings: GameSettings) {
        const game = new Game(gameSettings);
        this.game = game;
        const gameDisplay = new GameDisplay(
            game,
            this.stats,
            this.lastMainPage == Pages.SetupMenu,
        );
        this.showScreen(gameDisplay);
    }

    /**
     * Set a timer to fade out the current screen.
     */
    resetState() {
        // force-clear any previous screens (in case of fast navigation)
        if (this.previousScreenDestroyTimeout) {
            window.clearTimeout(this.previousScreenDestroyTimeout);
            if (this.previousScreenDestroy) this.previousScreenDestroy();
            this.previousScreenDestroy = undefined;
            this.previousScreenDestroyTimeout = undefined;
        }
        // gracefully clear and destroy the current screen
        if (this.currentScreen) {
            const oldDestroy = this.currentScreenDestroy;
            this.currentScreenDestroy = undefined;
            const screen = this.currentScreen;
            this.currentScreen = undefined;
            screen.element.classList.add("disappear");
            this.previousScreenDestroy = () => {
                screen.element.remove();
                screen.destroy();
                if (oldDestroy) oldDestroy();
            };
            this.previousScreenDestroyTimeout = window.setTimeout(
                this.previousScreenDestroy,
                1000,
            );
        }
    }

    rescale() {
        if (this.currentScreen) {
            this.currentScreen.rescale();
        }
    }
}
