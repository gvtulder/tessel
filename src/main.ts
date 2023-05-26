import { DEBUG } from './settings.js';
import { MainGridDisplay } from "./ui/MainGridDisplay.js";
import { Grid } from './grid/Grid.js';
import { TileStackDisplay } from './ui/TileStackDisplay.js';
import { FixedOrderTileStack, TileStack } from './game/TileStack.js';
import { GridType, GridTypes } from './grid/old.GridType.js';
import { Tile } from './grid/Tile.js';
import { Game, GameSettings } from './game/Game.js';
import { GameDisplay } from './ui/GameDisplay.js';
import * as SaveGames from './saveGames.js';
import { MainMenuDisplay } from './ui/MainMenuDisplay.js';
import { GameController } from './ui/GameController.js';
import disableIosZoom from './lib/disable-ios-zoom.js';
import { Pattern } from './grid/Pattern.js';
import { TriangleOffsets, newCustomTileType } from './grid/old.CustomTile.js';
import { PatternEditorGridDisplay } from './ui/PatternEditorGridDisplay.js';
import { EditorDisplay } from './ui/EditorDisplay.js';


export function runEditorDebug() {
    let triangleOffsets : TriangleOffsets;
    let gridType : GridType;


    switch (window.location.hash) {
    case '#squares':
        // squares
        // clockwise
        triangleOffsets = [
            [ [0, 0], [0, 1], [0, 2], [0, 3]],
        ];
        gridType = GridTypes['square'];
        break;

    case '#rhombushex':
        // pointy hexagon
        // clockwise
        triangleOffsets = [
            [ [0, -1], [0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [-1, 1], [-1, 0] ],
        ];
        gridType = GridTypes['hex'];
        break;

    case '#rhombushex-tail':
        // pointy hexagon with a tail
        // clockwise
        triangleOffsets = [
            [ [0, -1], [0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [-1, 1], [-1, 0] ],
            // [ [3, 0], [3, 1], [4, 1], [4, 2], [3, 2], [3, 3], [2, 2], [2, 1] ],
            [ [3, 0], [3, 1], [4, 1], [4, 2], [3, 2], [3, 3], [2, 2], [1, 2], [1,3], [2, 1] ],
            [ [2,0], [2, -1], [3, -1], [4, -1], [3, -2], [4, 0] ],
        ];
        gridType = GridTypes['hex'];
        break;

    case '#rhombus-small':
        // small, two-triangle rhombus
        // clockwise
        triangleOffsets = [
            [ [1, 0], [2, 0] ],
            [ [3, 0], [3, 1] ],
            [ [1, 1], [2, 1] ],
            [ [4, 1], [4, 2] ],
        ];
        gridType = GridTypes['hex'];
        break;

    case '#triangle-small':
        // small, two-triangle rhombus
        // clockwise
        triangleOffsets = [
            [ [0, 0], [0, 1], [0, 2] ],
            [ [0, 3], [0, 4], [0, 5] ],
            [ [0, 6], [0, 7], [0, 8] ],
            [ [0, 9], [0, 10], [0, 11] ],
        ];
        gridType = GridTypes['triangle'];
        break;

    case '#hexagons':
    default:
        // hexagons
        // clockwise
        triangleOffsets = [
            [ [0, 0], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0] ],
        ];
        gridType = GridTypes['hex'];
        break;
    }

    const tileGrid = new Grid(gridType);
    const patternGrid = new Grid(gridType);

    const pattern = new Pattern(patternGrid, triangleOffsets);

    const display = new EditorDisplay(tileGrid, patternGrid, pattern);
    document.body.appendChild(display.element);

    display.enableAutoRescale();

    if (DEBUG.CONNECT_TILES) {
        display.tileEditorDisplay.gridDisplay.debugConnectAllTriangles();
        display.patternEditorDisplay.gridDisplay.debugConnectAllTriangles();
    }

    window.display = display;
}

export function runDebug() {
    const gridType = (GridTypes[['hex', 'square', 'triangle'][DEBUG.SELECT_GRID]] as GridType);

    const grid = new Grid(gridType);

    const display = new MainGridDisplay(grid, document.body, null);
    document.body.appendChild(display.element);

    if (DEBUG.CONNECT_TILES) {
        display.debugConnectAllTriangles();
    }

    window.display = display;
}

function startDebug() {
    const gridType = (GridTypes[['hex', 'square', 'triangle'][DEBUG.SELECT_GRID]] as GridType);

    const grid = new Grid(gridType);
    const tileStack = new TileStack(SaveGames.HexDebug.tileGenerator());
    const fixedOrderTileStack = new FixedOrderTileStack(tileStack, 3);

    const gridDisplay = new MainGridDisplay(grid, document.body);
    document.body.appendChild(gridDisplay.element);

    const tileStackDisplay = new TileStackDisplay(gridType, fixedOrderTileStack);
    document.body.appendChild(tileStackDisplay.element);

    const tile = new gridType.createTile(grid, 0, 0);
    tile.colors = ['red', 'green', 'blue', 'orange', 'white', 'purple'];
    grid.addTile(tile);

    grid.updateFrontier();

    /*
    let nb : Tile;
    for (const neighbor of grid.getOrAddTileNeighbors(tile)) {
        neighbor.colors = ['grey', 'grey', 'grey', 'grey', 'grey', 'grey'];
        nb = neighbor;
    }
    nb.colors = ['red', 'red', 'red', 'red', 'red', 'red'];
    for (const neighbor of grid.getOrAddTileNeighbors(nb)) {
        neighbor.colors = ['green', 'green', 'green', 'green', 'green', 'green'];
        nb = neighbor;
    }
    nb.colors = ['blue', 'blue', 'blue', 'blue', 'blue', 'blue'];
    for (const neighbor of grid.getOrAddTileNeighbors(nb)) {
        neighbor.colors = ['orange', 'orange', 'orange', 'orange', 'orange', 'orange'];
        nb = neighbor;
    }
    nb.colors = ['white', 'blue', 'blue', 'blue', 'blue', 'blue'];
    for (const neighbor of grid.getOrAddTileNeighbors(nb)) {
        neighbor.colors = ['white', 'blue', 'orange', 'orange', 'orange', 'orange'];
        nb = neighbor;
    }
    nb.colors = ['red', 'red', 'blue', 'blue', 'blue', 'blue'];
    for (const neighbor of grid.getOrAddTileNeighbors(nb)) {
        neighbor.colors = ['red', 'red', 'orange', 'orange', 'orange', 'orange'];
        nb = neighbor;
    }
    */


    tileStackDisplay.makeDraggable(gridDisplay);
    gridDisplay.makeDroppable((target : Tile, orientedColors : OrientedColors, indexOnStack : number) => {
        const colors = fixedOrderTileStack.slots[indexOnStack];
        target.colors = colors;
        fixedOrderTileStack.take(indexOnStack);
        grid.updateFrontier();
        return true;
    });
}

export function start() {
    let game : Game;
    if (SaveGames.lookup.has(window.location.hash.replace('#', ''))) {
        game = new Game(SaveGames.lookup.get(window.location.hash.replace('#', '')));
    } else {
        // game = new Game(SaveGames.HexDebug_BlackRed);
        // game = new Game(SaveGames.SquareDefault);
        // game = new Game(SaveGames.HexDefault);
        // game = new Game(SaveGames.CubeDefault);
        // game = new Game(SaveGames.HexDebug_BlackRed);
        game = new Game(SaveGames.SquareDefault);
    }

    const gameDisplay = new GameDisplay(game);
    document.body.appendChild(gameDisplay.element);
    gameDisplay.gridDisplay.rescaleGrid();

    window.gameDisplay = gameDisplay;
    window.game = game;
}

export function startMainMenu() {
    disableIosZoom();

    const controller = new GameController(document.body);
    controller.run();

    window.gameController = controller;
}
