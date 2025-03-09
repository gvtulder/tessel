import { Game, GameSettings, GameSettingsSerialized } from "../game/Game";
import { GameDisplay } from "./game/GameDisplay";
import { MainMenuDisplay } from "./menu/MainMenuDisplay";
import * as SaveGames from "../saveGames";
import { GameSetupDisplay } from "./setup";
import { ScreenDisplay } from "./ScreenDisplay";
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
                    window.history.pushState({}, "", `#${evt.gameId}`);
                }
                this.startGame(evt.gameSettings!);
            },
        );

        menuDisplay.addEventListener(UserEventType.SetupMenu, () => {
            this.container.removeChild(menuDisplay.element);
            this.currentScreen = undefined;
            window.history.pushState({}, "", `#setup`);
            this.showGameSetupDisplay();
        });
    }

    showGameSetupDisplay() {
        this.resetState();

        const setupDisplay = new GameSetupDisplay();
        this.currentScreen = setupDisplay;
        this.container.appendChild(setupDisplay.element);
        setupDisplay.rescale();

        setupDisplay.addEventListener(
            UserEventType.StartGameFromSetup,
            (evt: UserEvent) => {
                const settings = evt.gameSettingsSerialized!;
                console.log("Clicked play to start", settings);
                this.container.removeChild(setupDisplay.element);
                this.currentScreen = undefined;
                setupDisplay.destroy();
                window.history.pushState(
                    {},
                    "",
                    `#${btoa(JSON.stringify(settings))}`,
                );
                const gameSettings = this.gameFromSerializedSettings(settings);
                if (gameSettings) this.startGame(gameSettings);
            },
        );
    }

    gameFromSerializedSettings(
        serialized: GameSettingsSerialized,
    ): GameSettings | null {
        const atlas = SaveGames.SetupCatalog.atlas.get(serialized.atlas);
        if (!atlas) return null;
        const colors = SaveGames.SetupCatalog.colors.get(serialized.colors);
        if (!colors) return null;
        const rules = SaveGames.SetupCatalog.rules.get(serialized.rules);
        if (!rules) return null;
        if (atlas.atlas.shapes.length != 1) {
            throw new Error("multi-shape atlas not yet supported");
        }
        const shape = atlas.atlas.shapes[0];
        const colorPattern = shape.colorPatterns[1 * serialized.segments];
        if (!colorPattern) return null;

        // TODO add support for multiple tile shapes
        const initialTile = colorPattern.segmentColors[0].map(
            (c) => colors.colors[c % colors.colors.length],
        );

        const settings: GameSettings = {
            atlas: atlas.atlas,
            colors: colors.colors,
            rules: rules.rules,
            scorer: rules.scorer,
            colorPatterns: [
                {
                    shape: shape,
                    colorPatterns: colorPattern,
                },
            ],
            initialTile: initialTile,
            tilesShownOnStack: 3,
            tileGenerator: [
                TileGenerators.forShapes(
                    atlas.atlas.shapes,
                    TileGenerators.permutations(colors.colors),
                    [colorPattern],
                ),
                TileGenerators.ensureNumber(60, 100),
            ],
        };
        return settings;
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
