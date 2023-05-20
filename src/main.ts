import { DEBUG } from './settings.js';
import { MainGridDisplay } from "./ui/MainGridDisplay.js";
import { Grid } from './grid/Grid.js';
import { TileStackDisplay } from './ui/TileStackDisplay.js';
import { FixedOrderTileStack, TileStack } from './game/TileStack.js';
import { GridType, GridTypes } from './grid/GridType.js';
import { OrientedColors, Tile } from './grid/Tile.js';
import { Game } from './game/Game.js';
import { GameDisplay } from './ui/GameDisplay.js';
import * as SaveGames from './saveGames.js';


export { GameManager } from './script.js';


export function runDebug() {
    const gridType = (GridTypes[['hex', 'square', 'triangle'][DEBUG.SELECT_GRID]] as GridType);

    const grid = new Grid(gridType);

    const display = new MainGridDisplay(grid);
    document.body.appendChild(display.element);

    if (DEBUG.CONNECT_TILES) {
        display.debugConnectAllTriangles();
    }

    window.display = display;
}

function startDebug() {
    const gridType = (GridTypes[['hex', 'square', 'triangle'][DEBUG.SELECT_GRID]] as GridType);

    const grid = new Grid(gridType);
    const tileStack = SaveGames.HexDebug.newTileStack();
    const fixedOrderTileStack = new FixedOrderTileStack(tileStack, 3);

    const gridDisplay = new MainGridDisplay(grid);
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
    // const game = new Game(SaveGames.HexDebug_BlackRed);
    // const game = new Game(SaveGames.SquareDefault);
    // const game = new Game(SaveGames.HexDefault);
    const game = new Game(SaveGames.CubeDefault);

    const gameDisplay = new GameDisplay(game);
    document.body.appendChild(gameDisplay.element);
}
