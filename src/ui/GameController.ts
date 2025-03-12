import {
    Game,
    gameFromSerializedSettings,
    GameSettings,
    GameSettingsSerialized,
} from "../game/Game";
import { GameDisplay } from "./game/GameDisplay";
import { MainMenuDisplay } from "./menu/MainMenuDisplay";
import * as SaveGames from "../saveGames";
import { GameSetupDisplay } from "./setup";
import { ScreenDisplay } from "./shared/ScreenDisplay";
import { TileGenerators } from "src/game/TileGenerator";
import { TileColor, TileColors } from "src/grid/Tile";

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
    container: HTMLElement;
    game?: Game;
    currentScreen?: ScreenDisplay;

    constructor(container: HTMLElement, version?: string) {
        this.container = container;
        this.version = version;

        window.addEventListener("resize", () => this.rescale());
    }

    run(saveGameId: string) {
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

    showMainMenu() {
        this.resetState();

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
            this.container.removeChild(menuDisplay.element);
            this.currentScreen = undefined;
            menuDisplay.removeEventListener(
                UserEventType.StartGame,
                handleStart,
            );
            menuDisplay.removeEventListener(
                UserEventType.SetupMenu,
                handleSetup,
            );
        };

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
            window.history.pushState({}, "", "/");
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
            this.container.removeChild(setupDisplay.element);
            this.currentScreen = undefined;
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
            window.history.pushState({}, "", "/");
            this.showMainMenu();
        };

        const handleRestart = () => {
            destroy();
            window.history.pushState({}, "", window.location.href);
            this.startGame(gameSettings);
        };

        const destroy = () => {
            gameDisplay.removeEventListener(
                UserEventType.BackToMenu,
                handleMenu,
            );
            gameDisplay.removeEventListener(
                UserEventType.RestartGame,
                handleRestart,
            );
        };

        gameDisplay.addEventListener(UserEventType.BackToMenu, handleMenu);
        gameDisplay.addEventListener(UserEventType.RestartGame, handleRestart);
    }

    resetState() {
        if (this.currentScreen) {
            const screen = this.currentScreen;
            this.currentScreen = undefined;
            screen.element.classList.add("disappear");
            window.setTimeout(() => {
                this.container.removeChild(screen.element);
                screen.destroy();
            }, 1000);
        }
    }

    rescale() {
        if (this.currentScreen) {
            this.currentScreen.rescale();
        }
    }
}
