import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { Grid } from "../grid/Grid.js";
import { FixedOrderTileStack, TileStack } from "../game/TileStack.js";
import { Tile } from "../grid/Tile.js";
import { GridDisplay, MainGridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { TileDisplay } from "./TileDisplay.js";
import { GridType } from "src/grid/GridType.js";

export class TileStackDisplay {
    gridType : GridType;
    tileStack : TileStack;
    fixedOrderTileStack : FixedOrderTileStack;
    tileDisplays : SingleTileOnStackDisplay[];
    element : HTMLDivElement;

    numberOfTiles = 3;

    constructor(gridType : GridType, tileStack : TileStack) {
        this.gridType = gridType;
        this.tileStack = tileStack;
        this.fixedOrderTileStack = new FixedOrderTileStack(tileStack, this.numberOfTiles);
        this.tileDisplays = [];
        this.build();

        this.updateTiles();
    }

    updateTiles() {
        for (let i=0; i<this.numberOfTiles; i++) {
            const color = this.fixedOrderTileStack.slots[i];
            this.tileDisplays[i].tile.colors = color ? color : null;
        }
    }

    remove(tile : Tile) {
        let index = 0;
        while (index < this.numberOfTiles && !(this.tileDisplays[index].tile === tile)) {
            index++;
        }
        if (index < this.numberOfTiles) {
            this.fixedOrderTileStack.take(index);
            this.updateTiles();
        }
    }

    build() {
        const div = document.createElement('div');
        div.className = 'tileStackDisplay';
        this.element = div;

        for (let i=0; i<this.numberOfTiles; i++) {
            const tileDisplay = new SingleTileOnStackDisplay(this.gridType);
            this.element.appendChild(tileDisplay.element);
            this.tileDisplays.push(tileDisplay);
        }
    }

    makeDraggable(mainGridDisplay : MainGridDisplay) {
        for (const tileDisplay of this.tileDisplays) {
            tileDisplay.makeDraggable(mainGridDisplay);
        }
    }
}


export interface DraggableTileHTMLDivElement extends HTMLDivElement {
  tileDisplay? : SingleTileOnStackDisplay;
}

class SingleTileOnStackDisplay {
    grid : Grid;
    gridDisplay : GridDisplay;
    tile : Tile;
    tileDisplay : TileDisplay;
    element : HTMLDivElement;
    draggable : Interactable;

    constructor(gridType : GridType) {
        this.grid = new Grid(gridType);
        this.gridDisplay = new TileStackGridDisplay(this.grid);
        this.tile = new gridType.createTile(this.grid, 0, 0);
        this.grid.addTile(this.tile);

        this.element = document.createElement('div');
        this.element.className = 'tileOnStack';
        this.element.appendChild(this.gridDisplay.element);

        this.element.style.position = 'relative';
        this.element.style.display = 'inline-block';
        this.element.style.width = '100px';
        this.element.style.height = '100px';

        this.gridDisplay.rescaleGrid();
    }

    makeDraggable(mainGridDisplay : MainGridDisplay) {
        (this.element as DraggableTileHTMLDivElement).tileDisplay = this;

        const position = { x: 0, y: 0 };
        this.draggable = interact(this.element).on('tap', () => {
            this.tile.rotateTile();
        }).draggable({
            listeners: {
                start: (evt : DragEvent) => {
                    console.log(evt.type, evt, evt.target);
                    evt.target.classList.add('dragging');
                    // TODO
                    // onDragStart(evt);
                },
                move: (evt : DragEvent) => {
                    position.x += evt.dx;
                    position.y += evt.dy;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${mainGridDisplay.scale / this.gridDisplay.scale})`;
                },
                end: (evt : DragEvent) => {
                    evt.target.classList.remove('dragging');
                    position.x = 0;
                    position.y = 0;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                },
            }
        });
    }

    removeDraggable() {
        if (this.draggable) {
            this.draggable.unset();
            this.draggable = null;
        }
    }
}
