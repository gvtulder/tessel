import { DEBUG } from './settings.js';
import { MainGridDisplay } from './ui/GridDisplay.js';
import { Grid } from './grid/Grid.js';
import { TileStackDisplay } from './ui/TileStackDisplay.js';
import { TileStack } from './game/TileStack.js';
import { GridType, GridTypes } from './grid/GridType.js';

import type { DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';


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
    }


    for (let i=0; i<tileStackDisplay.tileDisplays.length; i++) {
        const position = { x: 0, y: 0 };
        interact(tileStackDisplay.tileDisplays[i].element).draggable({
            listeners: {
                start (evt : DragEvent) {
                    console.log(evt.type, evt.target);
                    evt.target.classList.add('dragging');
                },
                move (evt : DragEvent) {
                    position.x += evt.dx;
                    position.y += evt.dy;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${gridDisplay.scale})`;
                },
                end (evt : DragEvent) {
                    position.x = 0;
                    position.y = 0;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    evt.target.classList.remove('dragging');
                },
            }
        });
    }
}
