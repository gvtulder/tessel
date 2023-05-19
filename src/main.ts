import { DEBUG } from './settings.js';
import { GridDisplay, MainGridDisplay } from './ui/GridDisplay.js';
import { Grid } from './grid/Grid.js';
import { TileStackDisplay } from './ui/TileStackDisplay.js';
import { TileStack } from './game/TileStack.js';
import { GridType, GridTypes } from './grid/GridType.js';

import type { DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';
import { Tile } from './grid/Tile.js';


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

export function start() {
    const gridType = (GridTypes[['hex', 'square', 'triangle'][DEBUG.SELECT_GRID]] as GridType);

    const grid = new Grid(gridType);
    const tileStack = new TileStack();

    const gridDisplay = new MainGridDisplay(grid);
    document.body.appendChild(gridDisplay.element);

    const tileStackDisplay = new TileStackDisplay(gridType, tileStack);
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
    gridDisplay.makeDroppable((target : Tile, source : Tile) => {
        target.colors = source.colors;
        grid.updateFrontier();
        tileStackDisplay.remove(source);
        return true;
    });
}
