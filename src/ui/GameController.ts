import { Game, GameSettings } from "../game/Game";
import { GameDisplay } from "./GameDisplay";
import { MainMenuDisplay, MenuEvent } from "./MainMenuDisplay";
import * as SaveGames from "../saveGames";

export class GameController {
    container: HTMLElement;
    game?: Game;
    gameDisplay?: GameDisplay;
    menuDisplay?: MainMenuDisplay;

    constructor(container: HTMLElement) {
        this.container = container;

        window.addEventListener("resize", () => this.rescale());
    }

    run(saveGameId: string) {
        const gameSettings = SaveGames.lookup.get(saveGameId);
        if (gameSettings) {
            this.startGame(gameSettings);
        } else {
            this.showMainMenu();
        }
    }

    showMainMenu() {
        this.resetState();

        const menuDisplay = new MainMenuDisplay();
        this.menuDisplay = menuDisplay;
        this.container.appendChild(menuDisplay.element);
        menuDisplay.rescale();

        menuDisplay.addEventListener("startgame", (evt: MenuEvent) => {
            this.container.removeChild(menuDisplay.element);
            this.menuDisplay = undefined;
            if (evt.gameId) {
                window.history.pushState({}, "", `/${evt.gameId}`);
            }
            this.startGame(evt.gameSettings!);
        });
    }

    startGame(gameSettings: GameSettings) {
        this.resetState();

        const game = new Game(gameSettings);
        this.game = game;
        const gameDisplay = new GameDisplay(game);
        this.gameDisplay = gameDisplay;
        this.container.appendChild(gameDisplay.element);
        gameDisplay.rescale();

        gameDisplay.addEventListener("clickbacktomenu", () => {
            if (this.game!.finished || window.confirm("Stop the game?")) {
                window.history.pushState({}, "", "/");
                this.showMainMenu();
            }
        });

        gameDisplay.addEventListener("clickrestartgame", () => {
            if (this.game!.finished || window.confirm("Restart the game?")) {
                window.history.pushState({}, "", window.location.href);
                this.startGame(gameSettings);
            }
        });
    }

    resetState() {
        if (this.menuDisplay) {
            const menuDisplay = this.menuDisplay;
            this.menuDisplay = undefined;
            menuDisplay.element.classList.add("disappear");
            window.setTimeout(() => {
                this.container.removeChild(menuDisplay.element);
                menuDisplay.destroy();
            }, 1000);
        }
        if (this.gameDisplay) {
            const gameDisplay = this.gameDisplay;
            this.gameDisplay = undefined;
            this.game = undefined;
            gameDisplay.element.classList.add("disappear");
            window.setTimeout(() => {
                this.container.removeChild(gameDisplay.element);
                gameDisplay.destroy();
            }, 1000);
        }
    }

    rescale() {
        if (this.gameDisplay) {
            this.gameDisplay.rescale();
        }
        if (this.menuDisplay) {
            this.menuDisplay.rescale();
        }
    }
}
