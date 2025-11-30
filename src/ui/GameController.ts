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
    GameState_S,
    serializedToJSON,
} from "../game/Game";
import { GameDisplay } from "./game/GameDisplay";
import { MainMenuDisplay } from "./menu/MainMenuDisplay";
import * as SaveGames from "../saveGames";
import { GameSetupDisplay } from "./setup/GameSetupDisplay";
import { ScreenDisplay } from "./shared/ScreenDisplay";
import { Workbox } from "workbox-window";
import { PaintDisplay } from "./paint/PaintDisplay";
import { Grid, TileSet_S } from "../grid/Grid";
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
import { getStorageBackend } from "../lib/storage-backend";
import * as zod from "zod";

const ControllerState_S = zod.object({
    hash: zod.string(),
    gameState: zod.optional(GameState_S),
    gridState: zod.optional(TileSet_S),
    lastMainPage: zod.optional(zod.enum(Pages)),
    lastSettingsTab: zod.optional(zod.enum(Pages)),
    history: zod.optional(zod.array(zod.string())),
});
type ControllerState_S = zod.infer<typeof ControllerState_S>;

export class GameController {
    version?: string;
    workbox?: Workbox;
    platform?: string;
    container: HTMLElement;
    stats: StatisticsMonitor;
    game?: Game;
    grid?: Grid;
    currentScreen?: ScreenDisplay;
    currentScreenDestroy?: null | (() => void);
    previousScreenDestroy?: null | (() => void);
    previousScreenDestroyTimeout?: number;
    restartNeeded?: boolean;
    mainNavBar: MainNavBar;

    history: NavigationHistory;

    lastNavBarItem?: NavBarItems | null;
    lastMainPage?: Pages;
    lastSettingsTab?: Pages;
    destroyMainNavBar: () => void;

    constructor(
        container: HTMLElement,
        version?: string,
        workbox?: Workbox,
        platform?: string,
    ) {
        this.container = container;
        this.version = version;
        this.workbox = workbox;
        this.platform = platform;
        this.stats = StatisticsMonitor.instance;

        this.history = new NavigationHistory();
        this.history.push("");
        this.history.push(window.location.hash.replace("#", ""));

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
        const nextHash = page == Pages.MainMenu ? "" : `#${page}`;
        this.history.push(nextHash.replace("#", ""));
        console.log("navigate to", nextHash);
        window.history.pushState(
            {},
            "",
            `${window.location.pathname}${nextHash}`,
        );
        this.run();
    }

    navigateBack(): boolean {
        // give the current screen the option to override the back button
        if (this.currentScreen && !this.currentScreen.handleBackButton()) {
            return true;
        }
        if (this.history.length == 1) {
            // failed to go back further
            // perhaps exit the app?
            return false;
        } else {
            this.history.pop();
            this.navigateTo(this.history.last!);
            return true;
        }
    }

    async run(attemptResume?: boolean) {
        // check if there is a previous state to resume
        // e.g, after the game was closed by the OS
        let state: ControllerState_S | undefined = undefined;
        if (attemptResume) {
            try {
                state = await this.getSavedControllerState();
            } catch (error) {
                console.log("Error loading resume state.", error);
            }
        }
        if (state) {
            // resume
            this.lastMainPage = state.lastMainPage;
            this.lastSettingsTab = state.lastSettingsTab;
            if (state.history) {
                for (const hash of state.history) {
                    this.history.push(hash);
                }
            }
            this.history.push(state.hash.replace("#", ""));
            window.history.replaceState({}, "", state.hash);
        }
        // make sure we only resume once after saving the state
        this.clearSaveControllerState();

        // cancel any running game
        this.game = undefined;
        this.grid = undefined;

        const saveGameId = window.location.hash.replace("#", "");
        const gameSettings = SaveGames.lookup.get(saveGameId);
        if (gameSettings) {
            this.startGame(gameSettings, state?.gameState);
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
                this.showPaintDisplay(
                    atlas.atlas,
                    saveGameId,
                    state?.gridState,
                );
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
                this.startGame(gameSettings, state?.gameState);
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
            this.navigateBack();
        };

        const handleRestart = () => {
            this.run();
        };

        const handleStartGame = (evt: UserEvent) => {
            if (evt.gameSettingsSerialized) {
                const settings = evt.gameSettingsSerialized!;
                this.navigateTo(btoa(serializedToJSON(settings)));
            } else if (evt.gameId) {
                this.navigateTo(evt.gameId);
            } else {
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
            new SettingsDisplay(this.version, this.platform),
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

    showPaintDisplay(atlas: Atlas, page: string, tileSet?: TileSet_S) {
        const grid = new Grid(atlas);
        if (tileSet) {
            grid.restoreTiles(tileSet);
        }
        this.grid = grid;
        const paintDisplay = new PaintDisplay(grid);
        this.showScreen(paintDisplay);
    }

    gameFromSerializedSettings(
        serialized: GameSettingsSerialized,
    ): GameSettings | null {
        return gameFromSerializedSettings(SaveGames.SetupCatalog, serialized);
    }

    async startGame(gameSettings: GameSettings, resumeState?: GameState_S) {
        const game = new Game(gameSettings, undefined, resumeState);
        this.game = game;
        const gameDisplay = new GameDisplay(
            game,
            this.stats,
            this.lastMainPage == Pages.SetupMenu,
        );
        this.showScreen(gameDisplay);
    }

    async getSavedControllerState(): Promise<ControllerState_S | undefined> {
        const state = await getStorageBackend().getItem("resumeState");
        return state ? ControllerState_S.parse(JSON.parse(state)) : undefined;
    }

    saveControllerState() {
        const state: ControllerState_S = {
            hash: window.location.hash,
            gameState: this.game?.saveState(),
            gridState: this.grid?.saveTilesAndPlaceholders(),
            lastMainPage: this.lastMainPage,
            lastSettingsTab: this.lastSettingsTab,
            history: this.history.history,
        };
        getStorageBackend().setItem("resumeState", JSON.stringify(state));
    }

    clearSaveControllerState() {
        getStorageBackend().removeItem("resumeState");
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
        if (window.getSelection) {
            // unselected all selected text in the current screen,
            // otherwise the selection highlight might linger until the
            // screen is finally removed
            const selection = window.getSelection();
            if (selection) selection.removeAllRanges();
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

class NavigationHistory {
    history: string[];

    constructor() {
        this.history = [];
    }

    push(page: string): void {
        if (page == "") {
            // reset when on main screen
            this.history = [""];
        } else {
            // deduplicate
            this.history = this.history.filter((h) => h != page);
            this.history.push(page);
        }
    }

    get last(): string | undefined {
        return this.history.length == 0
            ? undefined
            : this.history[this.history.length - 1];
    }

    pop(): string | undefined {
        return this.history.pop();
    }

    get length(): number {
        return this.history.length;
    }
}
