import interact from '@interactjs/interact/index';
import type { DragEvent, Interactable } from '@interactjs/types';

import { Grid } from "../grid/Grid.js";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileDisplay } from "./TileDisplay.js";
import { EditablePattern } from 'src/grid/EditablePattern.js';
import { Tile, TileType, TileVariant } from 'src/grid/Tile.js';
import { Pattern } from 'src/grid/Pattern.js';
import { EditableTile } from 'src/grid/EditableTile.js';

export class TileEditorStackDisplay {
    pattern : EditablePattern;
    tileDisplays : SingleTileOnEditorStackDisplay[];
    element : HTMLDivElement;
    counter : HTMLSpanElement;

    constructor(pattern : EditablePattern) {
        this.pattern = pattern;
        this.tileDisplays = [];
        this.build();
    }

    /** @deprecated */
    destroy() {
        return;
    }

    updateTiles(protoTile : EditableTile) {
        const tileVariants = protoTile.computeRotationVariants();
        for (let i=0; i<tileVariants.length; i++) {
            if (this.tileDisplays.length <= i) {
                const tileDisplay = new SingleTileOnEditorStackDisplay(this, i, this.pattern);
                this.element.appendChild(tileDisplay.element);
                this.tileDisplays.push(tileDisplay);
            }

            this.tileDisplays[i].updateTile(tileVariants[i]);
            this.tileDisplays[i].tile.colors = protoTile.colors;
        }
        for (let i=tileVariants.length; i<this.tileDisplays.length; i++) {
            this.tileDisplays[i].disable();
        }
        this.rescale();
    }

    build() {
        const div = document.createElement('div');
        div.className = 'tileStackDisplay';
        this.element = div;

        for (let i=0; i<3; i++) {
            const tileDisplay = new SingleTileOnEditorStackDisplay(this, i, this.pattern);
            this.element.appendChild(tileDisplay.element);
            this.tileDisplays.push(tileDisplay);
        }
    }

    rescale() {
        for (const t of this.tileDisplays) {
            t.rescale();
        }
    }

    /*
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
    */
}


class SingleTileOnEditorStackDisplay {
    tileStackDisplay : TileEditorStackDisplay;
    indexOnStack : number;
    grid : Grid;
    gridDisplay : GridDisplay;
    tile : Tile;
    tileDisplay : TileDisplay;
    element : HTMLDivElement;
    rotatable : HTMLDivElement;
    draggable : Interactable;

    constructor(tileStackDisplay : TileEditorStackDisplay, indexOnStack : number, pattern : Pattern) {
        this.tileStackDisplay = tileStackDisplay;
        this.indexOnStack = indexOnStack;

        this.tileStackDisplay = tileStackDisplay;
        this.indexOnStack = indexOnStack;
        this.grid = new Grid(pattern.triangleType, pattern);
        this.tile = new Tile(this.grid, 0, 0, TileType.TileOnStack, [[this.grid.getOrAddTriangle(0, 0)]]);
        this.grid.addTile(this.tile);


        this.element = document.createElement('div');
        this.element.className = 'tileOnStack';

        this.rotatable = document.createElement('div');
        this.rotatable.className = 'tileOnStack-rotatable';
        this.element.appendChild(this.rotatable);

        this.gridDisplay = new TileStackGridDisplay(this.grid, this.rotatable);

        this.rotatable.appendChild(this.gridDisplay.element);

        this.rescale();

        /*
        // TODO : this doesn't work for the hexagons
        let meanX = mean(this.grid.triangles.map((t) => (t.left + t.center[0])));
        let meanY = mean(this.grid.triangles.map((t) => (t.top + t.center[1])));
        meanX = meanX * 100 + parseFloat(this.gridDisplay.element.style.left.replace('px', ''));
        meanY = meanY * 100 + parseFloat(this.gridDisplay.element.style.top.replace('px', ''));
        this.rotatable.style.transformOrigin = `${meanX}px ${meanY}px`;
        */
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    updateTile(tileVariant : TileVariant) {
        this.tile.updateTrianglesFromShape(tileVariant.shape);
        this.element.style.display = '';
    }

    disable() {
        this.element.style.display = 'none';
    }
}
