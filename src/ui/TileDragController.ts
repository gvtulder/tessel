import type { Interactable, DragEvent } from '@interactjs/types';

import { GridDisplay } from "./GridDisplay.js";
import { TriangleOnScreenPosition } from "./TileDisplay.js";
import { Tile } from 'src/grid/Tile.js';

export class TileDragEvent extends Event {
    tileDragSource : TileDragSource;
    constructor(type : string, tileDragSource? : TileDragSource) {
        super(type);
        this.tileDragSource = tileDragSource;
    }
}

export class TileDragController extends EventTarget {
    gridDisplay : GridDisplay;
    sources : TileDragSource[];

    constructor(gridDisplay : GridDisplay) {
        super();
        this.gridDisplay = gridDisplay;
        this.sources = [];
    }

    addSource(source : TileDragSource) {
        this.sources.push(source);

        const draggable = source.getDraggable();
        const position = { x: 0, y: 0};
        draggable.draggable({
            listeners: {
                start: () => {
                    for (const s of this.sources) {
                        if (s !== source) s.resetDragStatus();
                    }
                    source.startDrag();
                    this.dispatchEvent(new TileDragEvent('startdrag', source));
                },
                move: (evt : DragEvent) => {
                    position.x += evt.dx;
                    position.y += evt.dy;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${this.gridDisplay.scale / source.gridDisplay.scale})`;

                    // figure out where we are
                    const movingPos = source.getTriangleOnScreenPosition();
                    const closestPair = this.gridDisplay.findClosestTriangleFromScreenPosition(movingPos);
                    // console.log('MOVE', 'closestPair', closestPair);
                },
                end: (evt : DragEvent) => {
                    // figure out where we are
                    const movingPos = source.getTriangleOnScreenPosition();
                    const closestPair = this.gridDisplay.findClosestTriangleFromScreenPosition(movingPos);

                    let successful = false;
                    if (closestPair && closestPair.dist < 50) {
                        successful = this.gridDisplay.dropTile(source, closestPair);
                    }
                    console.log('DROPPED', 'closestPair', closestPair, successful ? 'success' : 'no success');

                    // reset
                    source.endDrag(successful);
                    position.x = 0;
                    position.y = 0;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    this.dispatchEvent(new TileDragEvent('enddrag', source));
                    /*
                    evt.target.style.transformOrigin = 'center';
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    if (this.tile.isPlaceholder()) {
                        this.removeDraggable();
                    }
                    */
                },
            }
        });
    }
}

export interface TileDragSource {
    gridDisplay : GridDisplay;
    tile : Tile;
    rotation : number;
    indexOnStack? : number;
    getTriangleOnScreenPosition() : TriangleOnScreenPosition[];
    getDraggable() : Interactable;
    startDrag();
    endDrag(successful : boolean);
    resetDragStatus();
}
