import type { Interactable, DragEvent } from '@interactjs/types';

import { GridDisplay } from "./GridDisplay.js";
import { TriangleOnScreenMatch } from "./TileDisplay.js";
import { Tile, TileRotation, TileType } from 'src/grid/Tile.js';
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

        const context : TileDragSourceContext = {
            source: source,
            autorotateCurrentTarget: null,
            autorotateTimeout: null,
            autorotateCache: new Map<Tile, TileRotation>(),
            draggable: source.getDraggable(),
            position: { x: 0, y: 0},
        };

        context.draggable.draggable({
            listeners: {
                start: (evt : DragEvent) => this.onDragStart(context, evt),
                move: (evt : DragEvent) => this.onDragMove(context, evt),
                end: (evt : DragEvent) => this.onDragEnd(context, evt),
            }
        });

        if (DEBUG.LOG_MOUSE_POSITION) {
            this.gridDisplay.element.addEventListener('mouseover', (evt : PointerEvent) => {
                const cursorPos : Coord = [evt.clientX, evt.clientY];
                console.log('Mouse cursor:',  cursorPos,
                            'Grid coordinates:', this.gridDisplay.screenPositionToGridPosition(cursorPos),
                            'Triangle on grid:', this.gridDisplay.screenPositionToTriangleCoord(cursorPos));
            });
        }
    }

    onDragStart(context : TileDragSourceContext, evt : DragEvent) {
        for (const s of this.sources) {
            if (s !== context.source) s.resetDragStatus();
        }
        context.source.startDrag();
        this.dispatchEvent(new TileDragEvent(TileDragController.events.StartDrag, context.source));

        // precompute the placeholder tiles where this tile would fit
        if (this.autorotate || this.hints || this.snap) {
            context.autorotateCache.clear();
            // find possible locations where this tile would fit
            for (const placeholder of this.gridDisplay.grid.placeholderTiles) {
                const rotation = placeholder.computeRotationToFit(context.source.tile, context.source.rotation);
                if (rotation) {
                    // this tile would fit
                    context.autorotateCache.set(placeholder, rotation);
                }
            }
            // if hints are enabled, highlight possible/impossible tiles
            if (this.hints) {
                for (const tsd of this.gridDisplay.tileDisplays.values()) {
                    if (tsd.tile.type === TileType.Placeholder) {
                        tsd.highlightHint(context.autorotateCache.has(tsd.tile));
                    }
                }
            }
            console.log(context.autorotateCache);
        }
    }

    onDragMove(context : TileDragSourceContext, evt : DragEvent) {
        context.position.x += evt.dx;
        context.position.y += evt.dy;
        evt.target.style.transform = `translate(${context.position.x}px, ${context.position.y}px) scale(${this.gridDisplay.scale / context.source.gridDisplay.scale})`;

        if (this.autorotate) {
            // figure out where we are
            const movingTriangle = context.source.tile.triangles[0];
            const movingPos = context.source.gridDisplay.triangleToScreenPosition(movingTriangle)
            // match moving to fixed
            const fixedTriangleCoord = this.gridDisplay.screenPositionToTriangleCoord(movingPos);
            const fixedTriangle = this.gridDisplay.grid.getTriangle(...fixedTriangleCoord);

            // triangle matched?
            if (fixedTriangle && fixedTriangle.tile && fixedTriangle.tile.type === TileType.Placeholder) {
                if (context.autorotateCurrentTarget !== fixedTriangle.tile) {
                    // autorotate after a small delay
                    context.autorotateCurrentTarget = fixedTriangle.tile;
                    const rotation = context.autorotateCache.get(context.autorotateCurrentTarget);
                    if (rotation) {
                        // this tile would fit
                        if (context.autorotateTimeout) window.clearTimeout(context.autorotateTimeout);
                        context.autorotateTimeout = window.setTimeout(() => {
                            context.source.startAutorotate(rotation);
                        }, 100);
                    }
                }
            } else {
                // cancel the autorotation
                context.autorotateCurrentTarget = null;
                if (context.autorotateTimeout) {
                    window.clearTimeout(context.autorotateTimeout);
                    context.autorotateTimeout = null;
                }
                context.autorotateTimeout = window.setTimeout(() => {
                    // source.resetAutorotate();
                }, 100);
            }
            // console.log('MOVE', 'closestPair', closestPair);
        }

        if (this.snap) {
            // snapping?
            const movingTriangle = context.source.tile.triangles[0];
            const movingPos = context.source.gridDisplay.triangleToScreenPosition(movingTriangle)
            const fixedTriangleCoord = this.gridDisplay.screenPositionToTriangleCoord(movingPos);

            if (fixedTriangleCoord) {
                const rotatedMovingTriangle = movingTriangle.getRotationEdge(context.source.rotation.steps).to;
                const centerSnapFrom = context.source.gridDisplay.triangleToScreenPosition(movingTriangle);
                const fixedTriangle = this.gridDisplay.grid.getOrAddTriangle(...fixedTriangleCoord);
                const centerSnapTo = this.gridDisplay.triangleToScreenPosition(fixedTriangle);
                if (fixedTriangle &&
                    fixedTriangle.tile &&
                    fixedTriangle.tile.type === TileType.Placeholder &&
                    fixedTriangle.shape == rotatedMovingTriangle.shape &&
                    dist(centerSnapFrom, centerSnapFrom) < 30) {
                    const rot = context.autorotateCache.get(fixedTriangle.tile);
                    if (rot && rot.steps == context.source.rotation.steps) {
                        const snap = { x: context.position.x + centerSnapTo[0] - centerSnapFrom[0],
                                       y: context.position.y + centerSnapTo[1] - centerSnapFrom[1] };
                        evt.target.style.transform = `translate(${snap.x}px, ${snap.y}px) scale(${this.gridDisplay.scale / context.source.gridDisplay.scale})`;
                    }
                }
            }
        }
    }

    onDragEnd(context : TileDragSourceContext, evt : DragEvent) {
        // figure out where we are
        const movingTriangle = context.source.tile.triangles[0];
        const movingPos = context.source.gridDisplay.triangleToScreenPosition(movingTriangle)
        // match moving to fixed
        const fixedTriangleCoord = this.gridDisplay.screenPositionToTriangleCoord(movingPos);
        const fixedTriangle = this.gridDisplay.grid.getTriangle(...fixedTriangleCoord);

        let successful = false;
        if (fixedTriangle && fixedTriangle.tile && fixedTriangle.tile.type === TileType.Placeholder) {
            successful = this.gridDisplay.dropTile(context.source, { fixed: fixedTriangle, moving: movingTriangle });
        }
        console.log('DROPPED', movingTriangle, fixedTriangle, successful ? 'success' : 'no success');

        for (const tsd of this.gridDisplay.tileDisplays.values()) {
            tsd.removeHighlightHint();
        }

        // reset
        context.autorotateCache.clear();
        context.source.endDrag(successful);
        context.source.resetAutorotate(successful);
        context.position.x = 0;
        context.position.y = 0;
        evt.target.style.transform = `translate(${context.position.x}px, ${context.position.y}px)`;
        this.dispatchEvent(new TileDragEvent(TileDragController.events.EndDrag, context.source));

        /*
        evt.target.style.transformOrigin = 'center';
        evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
        */
    }
}

type TileDragSourceContext = {
    source : TileDragSource,
    autorotateCurrentTarget : Tile,
    autorotateTimeout : number,
    autorotateCache : Map<Tile, TileRotation>,
    draggable : Interactable,
    position : { x: number, y: number },
};

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
    resetAutorotate(keepRotation : boolean);
}
