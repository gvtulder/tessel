import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { Grid } from "../grid/Grid.js";
import { FixedOrderTileStack } from "../game/TileStack.js";
import { OrientedColors, Tile } from "../grid/Tile.js";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileDisplay } from "./TileDisplay.js";
import { GridType } from "src/grid/GridType.js";

export class TileStackDisplay {
    gridType : GridType;
    tileStack : FixedOrderTileStack;
    tileDisplays : SingleTileOnStackDisplay[];
    element : HTMLDivElement;
    counter : HTMLSpanElement;

    constructor(gridType : GridType, tileStack : FixedOrderTileStack) {
        this.gridType = gridType;
        this.tileStack = tileStack;
        this.tileDisplays = [];
        this.build();

        this.updateTiles();
        this.tileStack.addEventListener('updateSlots', () => {
            this.updateTiles();
        });
    }

    updateTiles() {
        for (let i=0; i<this.tileStack.numberShown; i++) {
            const color = this.tileStack.slots[i];
            this.tileDisplays[i].tile.colors = color ? color : null;
        }
        const n = this.tileStack.tilesLeft - this.tileStack.numberShown;
        if (n > 0) {
            this.counter.innerHTML = `+ ${Math.max(0, n)} tiles`;
        } else {
            this.counter.innerHTML = '';
        }
    }

    take(tile : Tile) {
        let index = 0;
        while (index < this.tileStack.numberShown && !(this.tileDisplays[index].tile === tile)) {
            index++;
        }
        if (index < this.tileStack.numberShown) {
            this.tileStack.take(index);
            this.updateTiles();
        }
    }

    build() {
        const div = document.createElement('div');
        div.className = 'tileStackDisplay';
        this.element = div;

        for (let i=0; i<this.tileStack.numberShown; i++) {
            const tileDisplay = new SingleTileOnStackDisplay(this, i, this.gridType);
            this.element.appendChild(tileDisplay.element);
            this.tileDisplays.push(tileDisplay);
        }

        const counterDiv = document.createElement('div');
        div.appendChild(counterDiv);
        counterDiv.className = 'tileStackDisplay-counter';

        const counter = document.createElement('span');
        counterDiv.appendChild(counter);
        this.counter = counterDiv;
    }

    makeDraggable(mainGridDisplay : MainGridDisplay, onDragStart : (evt) => void) {
        for (const tileDisplay of this.tileDisplays) {
            tileDisplay.makeDraggable(mainGridDisplay, onDragStart);
        }
    }

    resetDragStatus() {
        for (const t of this.tileDisplays) {
            t.element.classList.remove('drag-success');
            t.element.classList.remove('drag-return');
        }
    }
}


export interface DraggableTileHTMLDivElement extends HTMLDivElement {
  tileDisplay? : SingleTileOnStackDisplay;
  indexOnStack? : number;
  orientedColors? : OrientedColors;
}

class SingleTileOnStackDisplay {
    tileStackDisplay : TileStackDisplay;
    indexOnStack : number;
    grid : Grid;
    gridDisplay : GridDisplay;
    tile : Tile;
    tileDisplay : TileDisplay;
    element : HTMLDivElement;
    rotatable : HTMLDivElement;
    draggable : Interactable;
    rotation : number;
    angle : number;

    constructor(tileStackDisplay : TileStackDisplay, indexOnStack : number, gridType : GridType) {
        this.rotation = 0;
        this.angle = 0;

        this.tileStackDisplay = tileStackDisplay;
        this.indexOnStack = indexOnStack;
        this.grid = new Grid(gridType);
        this.gridDisplay = new TileStackGridDisplay(this.grid);
        this.tile = new gridType.createTile(this.grid, 0, 0);
        this.grid.addTile(this.tile);

        this.element = document.createElement('div');
        this.element.className = 'tileOnStack';
        this.element.style.position = 'relative';
        this.element.style.display = 'inline-block';
        this.element.style.width = '100px';
        this.element.style.height = '100px';

        this.rotatable = document.createElement('div');
        this.rotatable.className = 'tileOnStack-rotatable';
        this.rotatable.style.position = 'relative';
        this.rotatable.style.display = 'inline-block';
        this.rotatable.style.width = '100px';
        this.rotatable.style.height = '100px';
        this.element.appendChild(this.rotatable);

        this.rotatable.appendChild(this.gridDisplay.element);

        this.gridDisplay.rescaleGrid();

        this.rotatable.addEventListener('transitionend', () => {
            this.rotatable.classList.remove('animated');
            this.rotatable.classList.remove('drag-return');
            this.normalizeRotation();
        });
    }

    rotateTile() {
        const angles = this.tile.rotationAngles;
        const oldAngle = angles[this.rotation];
        this.rotation = (this.rotation + 1) % angles.length;
        const angleDiff = (360 + angles[this.rotation] - oldAngle) % 360;
        this.angle += angleDiff;
        this.rotatable.style.transform = `rotate(${this.angle}deg)`;
        this.rotatable.classList.add('animated');
    }

    normalizeRotation() {
        if (this.angle % 360 != this.angle) {
            this.angle = this.angle % 360;
            this.rotatable.style.transform = `rotate(${this.angle}deg)`;
        }
    }

    getOrientedColors() : OrientedColors {
        return this.tile.getOrientedColors(this.rotation);
    }

    makeDraggable(mainGridDisplay : MainGridDisplay, onDragStart: (evt) => void) {
        const context = (this.element as DraggableTileHTMLDivElement);
        context.tileDisplay = this;

        const position = { x: 0, y: 0 };
        this.draggable = interact(this.element).on('tap', (evt : Event) => {
            this.rotateTile();
            // TODO rename this function
            onDragStart(evt);
            evt.preventDefault();
        }).on('doubletap', (evt : Event) => {
            evt.preventDefault();
        }).on('hold', (evt : Event) => {
            evt.preventDefault();
        }).draggable({
            listeners: {
                start: (evt : DragEvent) => {
                    context.indexOnStack = this.indexOnStack;
                    context.orientedColors = this.getOrientedColors();
                    console.log(evt.type, evt, evt.target);

                    this.tileStackDisplay.resetDragStatus();
                    evt.target.classList.add('dragging');

                    evt.target.style.transformOrigin = `${evt.clientX - evt.rect.left}px ${evt.clientY - evt.rect.top}px`;
                    onDragStart(evt);
                },
                move: (evt : DragEvent) => {
                    position.x += evt.dx;
                    position.y += evt.dy;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${mainGridDisplay.scale / this.gridDisplay.scale})`;
                },
                end: (evt : DragEvent) => {
                    evt.target.classList.remove('dragging');
                    evt.target.classList.add('drag-return');
                    position.x = 0;
                    position.y = 0;
                    evt.target.style.transformOrigin = 'center';
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    if (this.tile.isPlaceholder()) {
                        this.removeDraggable();
                    }
                },
            }
        });

        this.element.addEventListener('transitionend', () => {
            this.element.classList.remove('drag-success');
            this.element.classList.remove('drag-return');
        });
    }

    removeDraggable() {
        if (this.draggable) {
            this.draggable.unset();
            this.draggable = null;
        }
    }
}
