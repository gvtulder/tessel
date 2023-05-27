import type { Interactable, DragEvent } from '@interactjs/types';

import { GridDisplay } from "./GridDisplay.js";
import { TriangleOnScreenMatch } from "./TileDisplay.js";
import { Tile, TileRotation } from 'src/grid/Tile.js';
import { GameController } from './GameController.js';
import { Coord, Triangle } from 'src/grid/Triangle.js';
import { DEBUG } from 'src/settings.js';
import { dist } from 'src/utils.js';

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
    snap : boolean;

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
                    if (this.autorotate || this.hints || this.snap) {
                        autorotateCache.clear();
                        // find possible locations where this tile would fit
                        for (const placeholder of this.gridDisplay.grid.placeholderTiles) {
                            const rotation = placeholder.computeRotationToFit(source.tile, source.rotation);
                            if (rotation) {
                                // this tile would fit
                                autorotateCache.set(placeholder, rotation);
                            }
                        }
                        // if hints are enabled, highlight possible/impossible tiles
                        if (this.hints) {
                            for (const tsd of this.gridDisplay.tileDisplays.values()) {
                                if (tsd.tile.isPlaceholder()) {
                                    tsd.highlightHint(autorotateCache.has(tsd.tile));
                                }
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
                        const movingTriangle = source.tile.triangles[0];
                        const movingPos = source.gridDisplay.triangleToScreenPosition(movingTriangle)
                        // match moving to fixed
                        const fixedTriangleCoord = this.gridDisplay.screenPositionToTriangleCoord(movingPos);
                        const fixedTriangle = this.gridDisplay.grid.getTriangle(...fixedTriangleCoord);

                        // triangle matched?
                        if (fixedTriangle && fixedTriangle.tile && fixedTriangle.tile.isPlaceholder()) {
                            if (autorotateCurrentTarget !== fixedTriangle.tile) {
                                // autorotate after a small delay
                                autorotateCurrentTarget = fixedTriangle.tile;
                                const rotation = autorotateCache.get(autorotateCurrentTarget);
                                if (rotation) {
                                    // this tile would fit
                                    if (autorotateTimeout) window.clearTimeout(autorotateTimeout);
                                    autorotateTimeout = window.setTimeout(() => {
                                        source.startAutorotate(rotation);
                                    }, 100);
                                }
                            }
                        } else {
                            // cancel the autorotation
                            autorotateCurrentTarget = null;
                            if (autorotateTimeout) {
                                window.clearTimeout(autorotateTimeout);
                                autorotateTimeout = null;
                            }
                            autorotateTimeout = window.setTimeout(() => {
                                // source.resetAutorotate();
                            }, 100);
                        }
                        // console.log('MOVE', 'closestPair', closestPair);
                    }

                    if (this.snap) {
                        // snapping?
                        const movingTriangle = source.tile.triangles[0];
                        const movingPos = source.gridDisplay.triangleToScreenPosition(movingTriangle)
                        const fixedTriangleCoord = this.gridDisplay.screenPositionToTriangleCoord(movingPos);

                        if (fixedTriangleCoord) {
                            const rotatedMovingTriangle = movingTriangle.getRotationEdge(source.rotation.steps).to;
                            const centerSnapFrom = source.gridDisplay.triangleToScreenPosition(movingTriangle);
                            const fixedTriangle = this.gridDisplay.grid.getOrAddTriangle(...fixedTriangleCoord);
                            const centerSnapTo = this.gridDisplay.triangleToScreenPosition(fixedTriangle);
                            if (fixedTriangle &&
                                fixedTriangle.tile &&
                                fixedTriangle.tile.isPlaceholder() &&
                                fixedTriangle.shape == rotatedMovingTriangle.shape &&
                                dist(centerSnapFrom, centerSnapFrom) < 30) {
                                const rot = autorotateCache.get(fixedTriangle.tile);
                                if (rot && rot.steps == source.rotation.steps) {
                                    const snap = { x: position.x + centerSnapTo[0] - centerSnapFrom[0],
                                                y: position.y + centerSnapTo[1] - centerSnapFrom[1] };
                                    evt.target.style.transform = `translate(${snap.x}px, ${snap.y}px) scale(${this.gridDisplay.scale / source.gridDisplay.scale})`;
                                }
                            }
                        }
                    }
                },
                end: (evt : DragEvent) => {
                    // figure out where we are
                    const movingTriangle = source.tile.triangles[0];
                    const movingPos = source.gridDisplay.triangleToScreenPosition(movingTriangle)
                    // match moving to fixed
                    const fixedTriangleCoord = this.gridDisplay.screenPositionToTriangleCoord(movingPos);
                    const fixedTriangle = this.gridDisplay.grid.getTriangle(...fixedTriangleCoord);

                    let successful = false;
                    if (fixedTriangle && fixedTriangle.tile && fixedTriangle.tile.isPlaceholder()) {
                        successful = this.gridDisplay.dropTile(source, { fixed: fixedTriangle, moving: movingTriangle });
                    }
                    console.log('DROPPED', movingTriangle, fixedTriangle, successful ? 'success' : 'no success');

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

        if (DEBUG.LOG_MOUSE_POSITION) {
            this.gridDisplay.element.addEventListener('mouseover', (evt : PointerEvent) => {
                const cursorPos : Coord = [evt.clientX, evt.clientY];
                console.log('Mouse cursor:',  cursorPos, 'Triangle on grid:',
                    this.gridDisplay.screenPositionToTriangleCoord(cursorPos));
            });
        }
    }
}

export interface TileDragSource {
    gridDisplay : GridDisplay;
    tile : Tile;
    rotation : TileRotation;
    indexOnStack? : number;
    getDraggable() : Interactable;
    startDrag();
    endDrag(successful : boolean);
    resetDragStatus();
    startAutorotate(rotation : TileRotation);
    resetAutorotate();
}
