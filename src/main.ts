import { Game } from './game/Game.js';
import { FixedOrderTileStack, TileStack } from './game/TileStack.js';
import { EditablePattern } from './grid/EditablePattern.js';
import { Grid } from './grid/Grid.js';
import { Pattern } from './grid/Pattern.js';
import { Tile } from './grid/Tile.js';
import disableIosZoom from './lib/disable-ios-zoom.js';
import * as SaveGames from './saveGames.js';
import { DEBUG } from './settings.js';
import { EditorDisplay } from './ui/EditorDisplay.js';
import { GameController } from './ui/GameController.js';
import { GameDisplay } from './ui/GameDisplay.js';
import { MainGridDisplay } from "./ui/MainGridDisplay.js";
import { TileStackDisplay } from './ui/TileStackDisplay.js';


export function runEditorDebug() {
    const gameSettings = SaveGames.lookup.get(window.location.hash.replace('#', ''));

    const pattern = new EditablePattern(gameSettings.triangleType);

    const display = new EditorDisplay(pattern);
    document.body.appendChild(display.element);
    display.start();

    window.addEventListener('resize', () => display.rescale());

    globalThis.display = display;
}

export function startMainMenu() {
    disableIosZoom();

    if (window.location.pathname != '/') {
        window.location.href = '/';
        return;
    }

    const controller = new GameController(document.body);
    controller.run(window.location.hash.replace('#', ''));

    globalThis.gameController = controller;

    document.getElementById('version').innerHTML = '{version}';
}
