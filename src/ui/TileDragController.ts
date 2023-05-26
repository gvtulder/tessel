import type { Interactable, DragEvent } from '@interactjs/types';

import { GridDisplay } from "./GridDisplay.js";
import { TriangleOnScreenMatch, TriangleOnScreenPosition } from "./TileDisplay.js";
import { Tile, TileRotation } from 'src/grid/Tile.js';
import { GameController } from './GameController.js';

export class TileDragEvent extends Event {
    tileDragSource : TileDragSource;
    constructor(type : string, tileDragSource? : TileDragSource) {
        super(type);
        this.tileDragSource = tileDragSource;
    }
}

export class TileDragController extends EventTarget {
    static events = {
        StartDrag: 'startdrag',
        EndDrag: 'enddrag',
    };

    gridDisplay : GridDisplay;
    sources : TileDragSource[];

    autorotate : boolean;
    hints : boolean;

    constructor(gridDisplay : GridDisplay) {
        super();
        this.gridDisplay = gridDisplay;
        this.sources = [];
    }

    addSource(source : TileDragSource) {
        this.sources.push(source);

        let autorotateCurrentTarget : Tile = null;
        let autorotateTimeout : number = null;
        const autorotateCache = new Map<Tile, TileRotation>();

        const draggable = source.getDraggable();
        const position = { x: 0, y: 0};
        draggable.draggable({
            listeners: {
                start: () => {
                    for (const s of this.sources) {
                        if (s !== source) s.resetDragStatus();
                    }
                    source.startDrag();
                    this.dispatchEvent(new TileDragEvent(TileDragController.events.StartDrag, source));

                    // precompute the placeholder tiles where this tile would fit
                    if (this.autorotate || this.hints) {
                        autorotateCache.clear();
                        // find possible locations where this tile would fit
                        for (const placeholder of this.gridDisplay.grid.placeholderTiles) {
                            const rotation = placeholder.computeRotationToFit(source.tile, source.rotation);
                            if (rotation && (this.autorotate || rotation.steps == source.rotation.steps)) {
                                // this tile would fit
                                autorotateCache.set(placeholder, rotation);
                            }
                        }
                        for (const tsd of this.gridDisplay.tileDisplays.values()) {
                            if (tsd.tile.isPlaceholder()) {
                                console.log('hint?', tsd, autorotateCache.has(tsd.tile));
                                tsd.highlightHint(autorotateCache.has(tsd.tile));
                            }
                        }
                        console.log(autorotateCache);
                    }
                },
                move: (evt : DragEvent) => {
                    position.x += evt.dx;
                    position.y += evt.dy;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px) scale(${this.gridDisplay.scale / source.gridDisplay.scale})`;

                    if (this.autorotate) {
                        // figure out where we are
                        const movingPos = source.getTriangleOnScreenPosition();
                        const closestPair = this.gridDisplay.findClosestTriangleFromScreenPosition(movingPos);
                        if (closestPair && closestPair.dist < 100 && closestPair.fixed.triangle.tile) {
                            if (autorotateCurrentTarget !== closestPair.fixed.triangle.tile) {
                                // autorotate after a small delay
                                autorotateCurrentTarget = closestPair.fixed.triangle.tile;
                                const rotation = autorotateCache.get(autorotateCurrentTarget);
                                if (rotation) {
                                    // this tile would fit
                                    autorotateTimeout = window.setTimeout(() => {
                                        source.startAutorotate(rotation);
                                    }, 200);
                                }
                            }
                        } else {
                            // cancel the autorotation
                            autorotateCurrentTarget = null;
                            if (autorotateTimeout) {
                                window.clearTimeout(autorotateTimeout);
                                autorotateTimeout = null;
                            }
                            source.resetAutorotate();
                        }
                        // console.log('MOVE', 'closestPair', closestPair);
                    }
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

                    for (const tsd of this.gridDisplay.tileDisplays.values()) {
                        tsd.removeHighlightHint();
                    }

                    // reset
                    source.resetAutorotate();
                    autorotateCache.clear();
                    source.endDrag(successful);
                    position.x = 0;
                    position.y = 0;
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    this.dispatchEvent(new TileDragEvent(TileDragController.events.EndDrag, source));
                    /*
                    evt.target.style.transformOrigin = 'center';
                    evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    */
                },
            }
        });
    }
}

export interface TileDragSource {
    gridDisplay : GridDisplay;
    tile : Tile;
    rotation : TileRotation;
    indexOnStack? : number;
    getTriangleOnScreenPosition() : TriangleOnScreenPosition[];
    getDraggable() : Interactable;
    startDrag();
    endDrag(successful : boolean);
    resetDragStatus();
    startAutorotate(rotation : TileRotation);
    resetAutorotate();
}
