import interact from '@interactjs/interact/index';
import type { DragEvent, Interactable } from '@interactjs/types';

import { Grid } from "../grid/Grid.js";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileDisplay } from "./TileDisplay.js";
import { EditablePattern } from 'src/grid/EditablePattern.js';
import { Tile, TileRotation, TileShape, TileType, TileVariant } from 'src/grid/Tile.js';
import { Pattern } from 'src/grid/Pattern.js';
import { EditableTile } from 'src/grid/EditableTile.js';
import { TileDragController, TileDragSource } from './TileDragController.js';
import { BaseTileStackDisplay, SingleTileOnStackDisplay, TileStackDisplay } from './TileStackDisplay.js';

export class TileEditorStackDisplay extends BaseTileStackDisplay {
    tileDragController : TileDragController;

    constructor(pattern : EditablePattern, tileDragController : TileDragController) {
        super(pattern, tileDragController);
        this.tileDragController = tileDragController;
    }

    /** @deprecated */
    destroy() {
        return;
    }

    updateTiles(protoTile : EditableTile) {
        const tileVariants = protoTile.computeRotationVariants();
        for (let i=0; i<tileVariants.length; i++) {
            if (this.tileDisplays.length <= i) {
                const tileDisplay = new SingleTileOnStackDisplay(this, i, this.pattern, false);
                this.element.appendChild(tileDisplay.element);
                this.tileDisplays.push(tileDisplay);
                this.tileDragController.addSource(tileDisplay);
            }

            this.tileDisplays[i].updateTile(tileVariants[0].shape, i);
            this.tileDisplays[i].tile.colors = protoTile.colors;
        }
        for (let i=tileVariants.length; i<this.tileDisplays.length; i++) {
            this.tileDisplays[i].disable();
        }
        this.rescale();
    }
}


/**
 * @deprecated
 */
class OldSingleTileOnEditorStackDisplay implements TileDragSource {
    tileStackDisplay : TileEditorStackDisplay;
    indexOnStack : number;
    grid : Grid;
    gridDisplay : GridDisplay;
    tile : Tile;
    tileDisplay : TileDisplay;
    element : HTMLDivElement;
    rotatable : HTMLDivElement;
    draggable : Interactable;
    rotation: TileRotation;

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

    getDraggable(): Interactable {
        if (!this.draggable) {
            this.draggable = interact(this.element);
        }
        return this.draggable;
    }

    startDrag() {
        return;
    }
    endDrag(successful: boolean) {
        return;
    }
    resetDragStatus() {
        return;
    }
    startAutorotate(rotation: TileRotation) {
        throw new Error('Method not implemented.');
    }
    resetAutorotate(keepRotation: boolean) {
        throw new Error('Method not implemented.');
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    /**
     * Updates the tile shape and rotates to the given rotation.
     * @param shape the new tile shape
     * @param rotationIdx the required rotation
     */
    updateTile(shape : TileShape, rotationIdx : number) {
        this.tile.updateTrianglesFromShape(shape);
        this.rotateTileTo(rotationIdx);
        this.element.style.display = '';
    }

    disable() {
        this.element.style.display = 'none';
    }
}
