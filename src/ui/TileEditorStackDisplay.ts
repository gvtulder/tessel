import interact from '@interactjs/interact/index';
import type { DragEvent, Interactable } from '@interactjs/types';

import { Grid } from "../grid/Grid.js";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileDisplay } from "./TileDisplay.js";
import { CopyTile } from './TileEditorDisplay.js';

export class TileEditorStackDisplay {
    gridType : GridType;
    tileDisplays : SingleTileOnEditorStackDisplay[];
    element : HTMLDivElement;
    counter : HTMLSpanElement;

    constructor(gridType : GridType) {
        this.gridType = gridType;
        this.tileDisplays = [];
        this.build();
    }

    updateTiles(protoTile : EditableTile) {
        const tileVariants = protoTile.computeRotationVariants();
        for (let i=0; i<this.tileDisplays.length; i++) {
            if (i < tileVariants.length) {
                this.tileDisplays[i].updateTile(tileVariants[i]);
                this.tileDisplays[i].tile.colors = protoTile.colors;
            } else {
                this.tileDisplays[i].disable();
            }
        }
    }

    build() {
        const div = document.createElement('div');
        div.className = 'tileStackDisplay';
        this.element = div;

        for (let i=0; i<this.gridType.rotationAngles.length; i++) {
            const tileDisplay = new SingleTileOnEditorStackDisplay(this, i, this.gridType);
            this.element.appendChild(tileDisplay.element);
            this.tileDisplays.push(tileDisplay);
        }
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
  tileDisplay? : SingleTileOnEditorStackDisplay;
  indexOnStack? : number;
  orientedColors? : OrientedColors;
  originalOrientedColors? : OrientedColors;
}

class SingleTileOnEditorStackDisplay {
    tileStackDisplay : TileEditorStackDisplay;
    indexOnStack : number;
    grid : Grid;
    gridDisplay : GridDisplay;
    tile : CopyTile;
    tileDisplay : TileDisplay;
    element : HTMLDivElement;
    rotatable : HTMLDivElement;
    draggable : Interactable;

    constructor(tileStackDisplay : TileEditorStackDisplay, indexOnStack : number, gridType : GridType) {
        this.tileStackDisplay = tileStackDisplay;
        this.indexOnStack = indexOnStack;
        this.grid = new Grid(gridType);
        this.gridDisplay = new TileStackGridDisplay(this.grid);
        this.tile = new CopyTile(this.grid, 0, 0);
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

        this.gridDisplay.rescale();

        /*
        // TODO : this doesn't work for the hexagons
        let meanX = mean(this.grid.triangles.map((t) => (t.left + t.center[0])));
        let meanY = mean(this.grid.triangles.map((t) => (t.top + t.center[1])));
        meanX = meanX * 100 + parseFloat(this.gridDisplay.element.style.left.replace('px', ''));
        meanY = meanY * 100 + parseFloat(this.gridDisplay.element.style.top.replace('px', ''));
        this.rotatable.style.transformOrigin = `${meanX}px ${meanY}px`;
        */
    }

    getOrientedColors() : OrientedColors {
        return this.tile.getOrientedColors(0);
    }

    makeDraggable(mainGridDisplay : MainGridDisplay, onDragStart: (evt) => void) {
        const context = (this.element as DraggableTileHTMLDivElement);
        context.tileDisplay = this;

        const position = { x: 0, y: 0 };
        this.draggable = interact(this.element).on('tap', (evt : Event) => {
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
                    context.originalOrientedColors = context.orientedColors;
                    console.log(evt.type, evt, evt.target);

                    this.tileStackDisplay.resetDragStatus();
                    evt.target.classList.add('dragging');

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

    updateTile(tileVariant : TileVariant) {
        this.tile.replaceTriangleOffsets(tileVariant.offsets);
        this.element.style.display = '';
    }

    disable() {
        this.element.style.display = 'none';
    }
}
