import interact from 'interactjs';
import type { DragEvent, Interactable } from '@interactjs/types';

import { Grid } from "../grid/Grid.js";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { MainGridDisplay } from "./MainGridDisplay.js";
import { TileDisplay } from "./TileDisplay.js";
import { EditablePattern } from '../grid/EditablePattern.js';
import { Tile, TileRotation, TileShape, TileType, TileVariant } from '../grid/Tile.js';
import { Pattern } from '../grid/Pattern.js';
import { EditableTile } from '../grid/EditableTile.js';
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
        const tileVariants = protoTile.computeRotationVariants(false, false);
        for (let i=0; i<tileVariants.length; i++) {
            if (this.tileDisplays.length <= i) {
                const tileDisplay = new SingleTileOnStackDisplay(this, i, this.pattern, false);
                this.element.appendChild(tileDisplay.element);
                this.tileDisplays.push(tileDisplay);
                this.tileDragController.addSource(tileDisplay);
            }

            this.tileDisplays[i].updateTileFromShape(tileVariants[0].shape, i);
            this.tileDisplays[i].tile.colors = protoTile.colors;
        }
        for (let i=tileVariants.length; i<this.tileDisplays.length; i++) {
            this.tileDisplays[i].disable();
        }
        this.rescale();
    }
}
