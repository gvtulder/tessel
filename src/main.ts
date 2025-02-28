import { Game } from "./game/Game";
import { FixedOrderTileStack, TileStack } from "./game/TileStack";
import { EditablePattern } from "./grid/EditablePattern";
import { Grid } from "./grid/Grid";
import { Pattern } from "./grid/Pattern";
import { Tile } from "./grid/Tile";
import disableIosZoom from "./lib/disable-ios-zoom";
import * as SaveGames from "./saveGames";
import { DEBUG } from "./settings";
import { EditorDisplay } from "./ui/EditorDisplay";
import { GameController } from "./ui/GameController";
import { GameDisplay } from "./ui/GameDisplay";
import { MainGridDisplay } from "./ui/MainGridDisplay";
import { TileStackDisplay } from "./ui/TileStackDisplay";

declare const VERSION: string;

export function runEditorDebug() {
    const gameSettings = SaveGames.lookup.get(
        window.location.hash.replace("#", ""),
    );

    const pattern = new EditablePattern(gameSettings.triangleType);

    const display = new EditorDisplay(pattern);
    document.body.appendChild(display.element);
    display.start();

    window.addEventListener("resize", () => display.rescale());

    globalThis.display = display;
}

export function startMainMenu() {
    disableIosZoom();

    if (window.location.pathname != "/") {
        window.location.href = "/";
        return;
    }

    const controller = new GameController(document.body);
    controller.run(window.location.hash.replace("#", ""));

    globalThis.gameController = controller;

    document.getElementById("version").innerHTML = `${VERSION}`;
}

startMainMenu();
