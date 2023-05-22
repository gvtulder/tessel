import { Game, GameSettings } from "src/game/Game.js";
import { GameDisplay } from "./GameDisplay.js";
import { MainMenuDisplay, MenuEvent } from "./MainMenuDisplay.js";

export class GameController {
    container : HTMLElement;
    game : Game;
    gameDisplay : GameDisplay;
    menuDisplay : MainMenuDisplay;

    constructor(container : HTMLElement) {
        this.container = container;
    }

    run() {
        this.showMainMenu();
    }

    showMainMenu() {
        this.resetState();

        const menuDisplay = new MainMenuDisplay();
        this.container.appendChild(menuDisplay.element);

        menuDisplay.addEventListener('startgame', (evt : MenuEvent) => {
            this.container.removeChild(menuDisplay.element);
            this.menuDisplay = null;
            this.startGame(evt.gameSettings);
        });
    }

    startGame(gameSettings : GameSettings) {
        this.resetState();

        const game = new Game(gameSettings);
        this.game = game;
        const gameDisplay = new GameDisplay(game);
        this.gameDisplay = gameDisplay;
        this.container.appendChild(gameDisplay.element);
        gameDisplay.gridDisplay.rescaleGrid();

        gameDisplay.addEventListener('clickbacktomenu', () => {
            this.showMainMenu();
        });

        gameDisplay.addEventListener('clickrestartgame', () => {
            this.startGame(gameSettings);
        });
    }

    resetState() {
        if (this.menuDisplay) {
            const menuDisplay = this.menuDisplay;
            this.menuDisplay = null;
            menuDisplay.element.classList.add('disappear');
            window.setTimeout(() => {
                this.container.removeChild(menuDisplay.element);
            }, 1000);
        }
        if (this.gameDisplay) {
            const gameDisplay = this.gameDisplay;
            this.gameDisplay = null;
            this.game = null;
            gameDisplay.element.classList.add('disappear');
            window.setTimeout(() => {
                this.container.removeChild(gameDisplay.element);
            }, 1000);
        }
    }
}
