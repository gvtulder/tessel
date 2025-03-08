import { Game, GameSettings } from "../game/Game";
import { GameDisplay } from "./game/GameDisplay";
import { MainMenuDisplay } from "./menu/MainMenuDisplay";
import * as SaveGames from "../saveGames";
import { GameSetupDisplay } from "./setup";
import { ScreenDisplay } from "./ScreenDisplay";

export const enum UserEventType {
    StartGame = "startgame",
    BackToMenu = "backtomenu",
    RestartGame = "restartgame",
}

export class UserEvent extends Event {
    gameSettings?: GameSettings;
    gameId?: string;
    constructor(
        type: UserEventType,
        gameSettings?: GameSettings,
        gameId?: string,
    ) {
        super(type);
        this.gameSettings = gameSettings;
        this.gameId = gameId;
    }
}

export class GameController {
    container: HTMLElement;
    game?: Game;
    currentScreen?: ScreenDisplay;

    constructor(container: HTMLElement) {
        this.container = container;

        window.addEventListener("resize", () => this.rescale());
    }

    run(saveGameId: string) {
        const gameSettings = SaveGames.lookup.get(saveGameId);
        if (gameSettings) {
            this.startGame(gameSettings);
        } else if (saveGameId == "setup") {
            this.showGameSetupDisplay();
        } else {
            this.showMainMenu();
        }
    }

    showMainMenu() {
        this.resetState();

        const menuDisplay = new MainMenuDisplay();
        this.currentScreen = menuDisplay;
        this.container.appendChild(menuDisplay.element);
        menuDisplay.rescale();

        menuDisplay.addEventListener(
            UserEventType.StartGame,
            (evt: UserEvent) => {
                this.container.removeChild(menuDisplay.element);
                this.currentScreen = undefined;
                if (evt.gameId) {
                    window.history.pushState({}, "", `/${evt.gameId}`);
                }
                this.startGame(evt.gameSettings!);
            },
        );
    }

    showGameSetupDisplay() {
        this.resetState();

        const setupDisplay = new GameSetupDisplay();
        this.currentScreen = setupDisplay;
        this.container.appendChild(setupDisplay.element);
        setupDisplay.rescale();
    }

    startGame(gameSettings: GameSettings) {
        this.resetState();

        const game = new Game(gameSettings);
        this.game = game;
        const gameDisplay = new GameDisplay(game);
        this.currentScreen = gameDisplay;
        this.container.appendChild(gameDisplay.element);
        gameDisplay.rescale();

        gameDisplay.addEventListener(UserEventType.BackToMenu, () => {
            if (this.game!.finished || window.confirm("Stop the game?")) {
                window.history.pushState({}, "", "/");
                this.showMainMenu();
            }
        });

        gameDisplay.addEventListener(UserEventType.RestartGame, () => {
            if (this.game!.finished || window.confirm("Restart the game?")) {
                window.history.pushState({}, "", window.location.href);
                this.startGame(gameSettings);
            }
        });
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
