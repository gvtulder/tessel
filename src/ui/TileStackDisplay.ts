import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { Grid } from "../grid/Grid.js";
import { FixedOrderTileStack } from "../game/TileStack.js";
import { Tile, TileRotation } from "../grid/Tile.js";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { TileDisplay, TriangleOnScreenPosition } from "./TileDisplay.js";
import { TileDragController, TileDragSource } from './TileDragController.js';
import { Pattern } from 'src/grid/Pattern.js';

export class TileStackDisplay extends EventTarget {
    static events = {
        TapTile: 'taptile',
    };

    pattern : Pattern;
    tileStack : FixedOrderTileStack;
    tileDisplays : SingleTileOnStackDisplay[];
    element : HTMLDivElement;
    counter : HTMLSpanElement;

    constructor(pattern : Pattern, tileStack : FixedOrderTileStack) {
        super();

        this.pattern = pattern;
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
            this.counter.innerHTML = `+ ${n} tile${n == 1 ? '' : 's'}`;
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
            const tileDisplay = new SingleTileOnStackDisplay(this, i, this.pattern);
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

    makeDraggable(tileDragController : TileDragController) {
        for (const tileDisplay of this.tileDisplays) {
            tileDragController.addSource(tileDisplay);
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
}

class SingleTileOnStackDisplay implements TileDragSource {
    tileStackDisplay : TileStackDisplay;
    indexOnStack : number;
    grid : Grid;
    gridDisplay : GridDisplay;
    tile : Tile;
    element : HTMLDivElement;
    rotatable : HTMLDivElement;
    draggable : Interactable;
    rotationIdx : number;
    angle : number;

    constructor(tileStackDisplay : TileStackDisplay, indexOnStack : number, pattern : Pattern) {
        this.rotationIdx = 0;
        this.angle = 0;

        this.tileStackDisplay = tileStackDisplay;
        this.indexOnStack = indexOnStack;
        this.grid = new Grid(pattern.triangleType, pattern);
        this.gridDisplay = new TileStackGridDisplay(this.grid);
        this.tile = this.grid.getOrAddTile(0, 0);

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

        /*
        // TODO : this doesn't work for the hexagons
        let meanX = mean(this.grid.triangles.map((t) => (t.left + t.center[0])));
        let meanY = mean(this.grid.triangles.map((t) => (t.top + t.center[1])));
        meanX = meanX * 100 + parseFloat(this.gridDisplay.element.style.left.replace('px', ''));
        meanY = meanY * 100 + parseFloat(this.gridDisplay.element.style.top.replace('px', ''));
        this.rotatable.style.transformOrigin = `${meanX}px ${meanY}px`;
        */

        this.initInteractable();

        this.rotatable.addEventListener('transitionend', () => {
            this.rotatable.classList.remove('animated');
            this.rotatable.classList.remove('drag-return');
            this.normalizeRotation();
        });

        this.element.addEventListener('transitionend', () => {
            this.element.classList.remove('drag-success');
            this.element.classList.remove('drag-return');
        });
    }

    get rotation() : TileRotation {
        return this.tile.rotations[this.rotationIdx];
    }

    rotateTile() {
        this.rotateTileTo(this.rotationIdx + 1)
    }

    rotateTileTo(newRotation : number, reverse? : boolean, closest? : boolean) {
        const angles = this.tile.rotations.map((r) => r.angle);
        const oldAngle = angles[this.rotationIdx];
        this.rotationIdx = newRotation % angles.length;
        const reverseDiff = (360 + oldAngle - angles[this.rotationIdx]) % 360;
        const forwardDiff = (360 + angles[this.rotationIdx] - oldAngle) % 360;
        if (reverse || (closest && reverseDiff < forwardDiff)) {
            this.angle -= reverseDiff;
        } else {
            this.angle += forwardDiff;
        }
        this.rotatable.style.transform = `rotate(${this.angle}deg)`;
        this.rotatable.classList.add('animated');
    }

    normalizeRotation() {
        if ((360 + this.angle) % 360 != this.angle) {
            this.angle = (360 + this.angle) % 360;
            this.rotatable.style.transform = `rotate(${this.angle}deg)`;
        }
    }

    getTriangleOnScreenPosition() : TriangleOnScreenPosition[] {
        return this.gridDisplay.getTriangleOnScreenPosition();
    }

    initInteractable() {
        const draggable = this.getDraggable();
        draggable.on('tap', (evt : Event) => {
            this.rotateTile();
            this.tileStackDisplay.dispatchEvent(new Event(TileStackDisplay.events.TapTile));
            evt.preventDefault();
        }).on('doubletap', (evt : Event) => {
            evt.preventDefault();
        }).on('hold', (evt : Event) => {
            evt.preventDefault();
        });
    }

    getDraggable() {
        if (!this.draggable) {
            this.draggable = interact(this.element);
        }
        return this.draggable;
    }

    startDrag() {
        this.element.classList.remove('drag-return', 'drag-success');
        this.element.classList.add('dragging');
    }

    endDrag(successful : boolean) {
        this.element.classList.remove('dragging');
        this.element.classList.add('drag-return');
        if (successful) {
            this.element.classList.add('drag-success');
        }
    }

    resetDragStatus() {
        this.element.classList.remove('dragging', 'drag-return', 'drag-success');
    }

    removeDraggable() {
        // TODO
        if (this.draggable) {
            this.draggable.unset();
            this.draggable = null;
        }
    }

    startAutorotate(target : TileDisplay) : boolean {
        // TODO
        /*
        const orientedColors = target.tile.checkFitOrientedColorsWithRotation(this.getOrientedColors());
        if (orientedColors !== null) {
            this.rotateTileTo(orientedColors.rotation, false, true);
            return true;
        }
        */
        return false;
    }
}
