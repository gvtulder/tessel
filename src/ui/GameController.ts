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
import { AllGamesDisplay } from "./menu/AllGamesDisplay";
import { AboutDisplay } from "./about/AboutDisplay";
import { NavigationManager } from "./shared/NavigationManager";
import { Pages, UserEvent, UserEventType } from "./shared/UserEvent";
import { getStorageBackend } from "../lib/storage-backend";
import * as zod from "zod";
import {
    ScreenCarrousel,
    ScreenCarrouselFactory,
} from "./shared/ScreenCarrousel";
import { msg } from "@lingui/core/macro";
import icons from "./shared/icons";
import { NavBarItems } from "./shared/NavBar";
import { DestroyableEventListenerSet } from "./shared/DestroyableEventListenerSet";

const ControllerState_S = zod.object({
    hash: zod.string(),
    gameState: zod.optional(GameState_S),
    gridState: zod.optional(TileSet_S),
    lastMainPage: zod.optional(zod.enum(Pages)),
    history: zod.optional(zod.array(zod.string())),
});
type ControllerState_S = zod.infer<typeof ControllerState_S>;

type GameControllerConfig = {
    version?: string;
    useCustomHistory?: boolean;
    workbox?: Workbox;
    platform?: string;
};

export class GameController {
    version?: string;
    workbox?: Workbox;
    platform?: string;
    container: HTMLElement;
    stats: StatisticsMonitor;
    game?: Game;
    grid?: Grid;
    currentScreen?: ScreenDisplay | ScreenCarrousel;
    currentScreenDestroy?: null | (() => void);
    previousScreenDestroy?: null | (() => void);
    previousScreenDestroyTimeout?: number;
    restartNeeded?: boolean;

    navigation: NavigationManager;
    carrousel: ScreenCarrouselFactory;

    lastMainPage?: Pages;

    constructor(container: HTMLElement, config: GameControllerConfig) {
        this.container = container;
        this.version = config.version;
        this.workbox = config.workbox;
        this.platform = config.platform;
        this.stats = StatisticsMonitor.instance;

        this.navigation = new NavigationManager(
            config.useCustomHistory || false,
        );
        this.navigation.onNavigate = (reload?: boolean) => {
            this.run(undefined, reload);
        };

        const rescale = () => this.rescale();
        if (screen && screen.orientation) {
            screen.orientation.addEventListener("change", rescale);
        }
        window.addEventListener("resize", () => {
            rescale();
            // iOS Safari sometimes doesn't immediately update the sizes
            window.setTimeout(rescale, 50);
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

        this.carrousel = new ScreenCarrouselFactory([
            {
                tab: NavBarItems.MainMenu,
                icon: icons.houseIcon,
                title: msg({
                    id: "ui.menu.MainMenuButton",
                    message: "Home",
                }),
                page: Pages.MainMenu,
                screen: () => new MainMenuDisplay(this.version),
            },
            {
                tab: NavBarItems.AllGames,
                icon: icons.gridIcon,
                title: msg({
                    id: "ui.menu.AllGamesButton",
                    message: "All Games",
                }),
                page: Pages.AllGames,
                screen: () => new AllGamesDisplay(),
            },
            {
                tab: NavBarItems.Paint,
                icon: icons.paintbrushIcon,
                title: msg({ id: "ui.menu.PaintButton", message: "Paint" }),
                page: Pages.PaintMenu,
                screen: () => new PaintMenu(),
            },
            {
                tab: NavBarItems.Settings,
                icon: icons.gearsIcon,
                title: msg({
                    id: "ui.menu.SettingsButton",
                    message: "Settings",
                }),
                items: [
                    {
                        tab: NavBarItems.Settings,
                        icon: icons.gearsIcon,
                        title: msg({
                            id: "ui.menu.SettingsButton",
                            message: "Settings",
                        }),
                        page: Pages.Settings,
                        screen: () =>
                            new SettingsDisplay(this.version, this.platform),
                    },
                    {
                        tab: NavBarItems.About,
                        icon: icons.bookIcon,
                        title: msg({
                            id: "ui.menu.HowToPlayButton",
                            message: "How to play?",
                        }),
                        page: Pages.About,
                        screen: () => new AboutDisplay(this.version),
                    },
                    {
                        tab: NavBarItems.Statistics,
                        icon: icons.chartIcon,
                        title: msg({
                            id: "ui.menu.StatisticsButton",
                            message: "Statistics",
                        }),
                        page: Pages.Statistics,
                        screen: () => new StatisticsDisplay(this.stats),
                    },
                ],
            },
        ]);
    }

    async start() {
        // check if there is a previous state to resume
        // e.g, after the game was closed by the OS
        let state: ControllerState_S | undefined = undefined;
        try {
            state = await this.getSavedControllerState();
        } catch (error) {
            console.log("Error loading resume state.", error);
        }

        if (state && state.history) {
            // restore saved history
            this.navigation.restoreHistory(state.history);
            this.lastMainPage = state.lastMainPage;
        } else {
            // ensure default history
            this.navigation.restoreHistory(
                window.location.hash == "" ? [""] : ["", window.location.hash],
            );
        }

        this.run(state);
    }

    navigateTo(page: Pages | string, reload?: boolean) {
        const nextHash = page == Pages.MainMenu ? "" : `#${page}`;
        this.navigation.navigate(nextHash, reload);
    }

    navigateBack(): boolean {
        // give the current screen the option to override the back button
        if (this.currentScreen && !this.currentScreen.handleBackButton()) {
            return true;
        }
        return this.navigation.back();
    }

    run(resumeState?: ControllerState_S, reload?: boolean) {
        // make sure we only resume once after saving the state
        this.clearSaveControllerState();

        // cancel any running game
        this.game = undefined;
        this.grid = undefined;

        const saveGameId = window.location.hash.replace("#", "");
        const gameSettings = SaveGames.lookup.get(saveGameId);
        if (gameSettings) {
            this.startGame(gameSettings, resumeState?.gameState);
        } else if (this.carrousel.pages.has(saveGameId)) {
            this.showInCarrousel(saveGameId as Pages, reload);
        } else if (saveGameId == Pages.SetupMenu) {
            this.showGameSetupDisplay();
        } else if (saveGameId.match("^paint-")) {
            const key = saveGameId.split("-")[1];
            const atlas = SaveGames.SetupCatalog.atlas.get(key);
            if (atlas) {
                this.showPaintDisplay(
                    atlas.atlas,
                    saveGameId,
                    resumeState?.gridState,
                );
            } else {
                this.showInCarrousel(Pages.PaintMenu, reload);
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
                this.startGame(gameSettings, resumeState?.gameState);
            } else {
                this.showInCarrousel(Pages.MainMenu, reload);
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
        lastMainPage?: Pages,
        handlers?: [UserEventType, () => void][],
    ) {
        window.setTimeout(() => {
            screen.element.classList.remove("appear", "appear-initial");
        }, 1000);
        screen.element.classList.add("appear", "appear-initial");

        this.resetState();
        if (lastMainPage) {
            this.lastMainPage = lastMainPage;
        }

        const listeners = new DestroyableEventListenerSet();
        listeners
            .forTarget(screen)
            .addEventListener(UserEventType.Navigate, (evt: UserEvent) =>
                this.navigateTo(evt.page!, evt.reload),
            )
            .addEventListener(UserEventType.BackToMenu, () =>
                this.navigateBack(),
            )
            .addEventListener(UserEventType.RestartGame, () => this.run())
            .addEventListener(UserEventType.StartGame, (evt: UserEvent) => {
                if (evt.gameSettingsSerialized) {
                    const settings = evt.gameSettingsSerialized!;
                    this.navigateTo(btoa(serializedToJSON(settings)));
                } else if (evt.gameId) {
                    this.navigateTo(evt.gameId);
                } else {
                    this.startGame(evt.gameSettings!);
                }
            });

        for (const [eventType, handler] of handlers || []) {
            listeners.addEventListener(screen, eventType, handler);
        }

        this.currentScreen = screen;
        this.container.appendChild(screen.element);
        screen.rescale();

        const destroy = () => {
            screen.element.remove();
            listeners.removeAll();
        };
        this.currentScreenDestroy = destroy;
    }

    showInCarrousel(page: Pages, reload?: boolean) {
        this.lastMainPage = page;
        if (!reload && this.currentScreen instanceof ScreenCarrousel) {
            this.currentScreen.showScreen(page);
            return;
        }
        if (this.checkForUpdate()) return;
        const carrousel = this.carrousel.build();
        carrousel.showScreen(page);
        this.showScreen(carrousel, page);
    }

    showGameSetupDisplay() {
        this.showScreen(new GameSetupDisplay(), Pages.SetupMenu);
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
            history: this.navigation.history,
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
