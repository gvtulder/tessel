import {
    Game,
    gameFromSerializedSettings,
    GameSettings,
    GameSettingsSerialized,
} from "../game/Game";
import { GameDisplay } from "./game/GameDisplay";
import { MainMenuDisplay } from "./menu/MainMenuDisplay";
import * as SaveGames from "../saveGames";
import { GameSetupDisplay } from "./setup/GameSetupDisplay";
import { ScreenDisplay } from "./shared/ScreenDisplay";
import { Workbox } from "workbox-window";

export const enum UserEventType {
    StartGame = "startgame",
    BackToMenu = "backtomenu",
    RestartGame = "restartgame",
    SetupMenu = "setupmenu",
    StartGameFromSetup = "startgamefromsetup",
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
    game?: Game;
    currentScreen?: ScreenDisplay;
    currentScreenDestroy?: () => void;
    restartNeeded?: boolean;

    constructor(container: HTMLElement, version?: string, workbox?: Workbox) {
        this.container = container;
        this.version = version;
        this.workbox = workbox;

        const rescale = () => this.rescale();
        if (screen && screen.orientation) {
            screen.orientation.addEventListener("change", rescale);
        }
        window.addEventListener("resize", rescale);
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
        };
        this.currentScreenDestroy = destroy;

        menuDisplay.addEventListener(UserEventType.StartGame, handleStart);
        menuDisplay.addEventListener(UserEventType.SetupMenu, handleSetup);
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
                `#${btoa(JSON.stringify(settings))}`,
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
