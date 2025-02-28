import type { Interactable, DragEvent } from "@interactjs/types";

import { TriangleOnScreenMatch } from "./TileDisplay.js";
import { Tile, TileRotation, TileType } from "../grid/Tile.js";
import { GameController } from "./GameController.js";
import { Coord, Triangle } from "../grid/Triangle.js";
import { DEBUG } from "../settings.js";
import { dist } from "../utils.js";
import { Grid } from "../grid/Grid.js";
import { GridDisplay } from "./GridDisplay.js";

export class TileDragEvent extends Event {
    tileDragSource: TileDragSource;
    constructor(type: string, tileDragSource?: TileDragSource) {
        super(type);
        this.tileDragSource = tileDragSource;
    }
}

export class TileDragController extends EventTarget {
    static events = {
        StartDrag: "startdrag",
        EndDrag: "enddrag",
    };

    dropTarget: TileDropTarget;
    sources: TileDragSource[];

    snap: boolean;

    constructor(dropTarget: TileDropTarget) {
        super();
        this.dropTarget = dropTarget;
        this.sources = [];
    }

    destroy() {
        // TODO
    }

    addSource(source: TileDragSource) {
        this.sources.push(source);

        const context: TileDragSourceContext = {
            source: source,
            autorotateCurrentTarget: null,
            autorotateTimeout: null,
            autorotateCache: new Map<Tile, TileRotation>(),
            draggable: source.getDraggable(),
            position: { x: 0, y: 0 },
        };

        context.draggable.draggable({
            listeners: {
                start: (evt: DragEvent) => this.onDragStart(context, evt),
                move: (evt: DragEvent) => this.onDragMove(context, evt),
                end: (evt: DragEvent) => this.onDragEnd(context, evt),
            },
        });

        if (DEBUG.LOG_MOUSE_POSITION) {
            this.dropTarget.element.addEventListener(
                "mouseover",
                (evt: PointerEvent) => {
                    const cursorPos: Coord = [evt.clientX, evt.clientY];
                    console.log(
                        "Mouse cursor:",
                        cursorPos,
                        "Grid coordinates:",
                        this.dropTarget.screenPositionToGridPosition(cursorPos),
                        "Triangle on grid:",
                        this.dropTarget.screenPositionToTriangleCoord(
                            cursorPos,
                        ),
                    );
                },
            );
        }
    }

    onDragStart(context: TileDragSourceContext, evt: DragEvent) {
        for (const s of this.sources) {
            if (s !== context.source) s.resetDragStatus();
        }
        context.source.startDrag();
        evt.target.style.translate = `0px 0px`;
        evt.target.style.scale = `${this.dropTarget.scale / context.source.gridDisplay.scale}`;
        context.source.resetCoordinateMapperCache();
        this.dispatchEvent(
            new TileDragEvent(
                TileDragController.events.StartDrag,
                context.source,
            ),
        );
    }

    onDragMove(context: TileDragSourceContext, evt: DragEvent) {
        context.position.x += evt.dx;
        context.position.y += evt.dy;
        evt.target.style.translate = `${context.position.x}px ${context.position.y}px`;
        evt.target.style.scale = `${this.dropTarget.scale / context.source.gridDisplay.scale}`;
        context.source.resetCoordinateMapperCache();

        if (this.snap) {
            // snapping?
            const movingTriangle = context.source.tile.triangles[0];
            const movingPos =
                context.source.gridDisplay.triangleToScreenPosition(
                    movingTriangle,
                );
            const fixedTriangleCoord =
                this.dropTarget.screenPositionToTriangleCoord(movingPos);

            if (fixedTriangleCoord) {
                const rotatedMovingTriangle = movingTriangle.getRotationEdge(
                    context.source.rotation.steps,
                ).to;
                const centerSnapFrom =
                    context.source.gridDisplay.triangleToScreenPosition(
                        movingTriangle,
                    );
                const fixedTriangle = this.dropTarget.grid.getOrAddTriangle(
                    ...fixedTriangleCoord,
                );
                const centerSnapTo =
                    this.dropTarget.triangleToScreenPosition(fixedTriangle);
                if (
                    fixedTriangle &&
                    fixedTriangle.placeholders &&
                    fixedTriangle.shape == rotatedMovingTriangle.shape &&
                    dist(centerSnapFrom, centerSnapFrom) < 30
                ) {
                    // find the best placeholder
                    const placeholders = fixedTriangle.placeholders.filter(
                        // must have a rotation that fits
                        (placeholder) => {
                            const rot =
                                context.autorotateCache.get(placeholder);
                            return (
                                rot &&
                                rot.steps == context.source.rotation.steps
                            );
                        },
                    );
                    if (placeholders.length > 0) {
                        // found a good placeholder
                        const placeholder = placeholders[0];
                        const rot = context.autorotateCache.get(placeholder);
                        if (rot && rot.steps == context.source.rotation.steps) {
                            const snap = {
                                x:
                                    context.position.x +
                                    centerSnapTo[0] -
                                    centerSnapFrom[0],
                                y:
                                    context.position.y +
                                    centerSnapTo[1] -
                                    centerSnapFrom[1],
                            };
                            evt.target.style.transform = `translate(${snap.x}px, ${snap.y}px) scale(${this.dropTarget.scale / context.source.gridDisplay.scale})`;
                        }
                    }
                }
            }
        }
    }

    onDragEnd(context: TileDragSourceContext, evt: DragEvent): boolean {
        context.source.resetCoordinateMapperCache();

        // figure out where we are
        const movingTriangle = context.source.tile.triangles[0];
        const movingPos =
            context.source.gridDisplay.triangleToScreenPosition(movingTriangle);
        // match moving to fixed
        const fixedTriangleCoord =
            this.dropTarget.screenPositionToTriangleCoord(movingPos);
        const fixedTriangle = this.dropTarget.grid.getOrAddTriangle(
            ...fixedTriangleCoord,
        );

        let successful = false;
        if (fixedTriangle) {
            successful = this.dropTarget.dropTile(context.source, {
                fixed: fixedTriangle,
                moving: movingTriangle,
            });
        }
        console.log(
            "DROPPED",
            movingTriangle,
            fixedTriangle,
            successful ? "success" : "no success",
        );

        // reset
        context.source.endDrag(successful);
        context.position.x = 0;
        context.position.y = 0;
        evt.target.style.translate = `${context.position.x}px ${context.position.y}px`;
        evt.target.style.scale = "";
        this.dispatchEvent(
            new TileDragEvent(
                TileDragController.events.EndDrag,
                context.source,
            ),
        );

        /*
        evt.target.style.transformOrigin = 'center';
        evt.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
        */

        return successful;
    }
}

export type TileDragSourceContext = {
    source: TileDragSource;
    autorotateCurrentTarget: Tile;
    autorotateTimeout: number;
    autorotateCache: Map<Tile, TileRotation>;
    draggable: Interactable;
    position: { x: number; y: number };
};

export interface TileDragSource {
    gridDisplay: GridDisplay;
    tile: Tile;
    rotation: TileRotation;
    indexOnStack?: number;
    getDraggable(): Interactable;
    startDrag();
    endDrag(successful: boolean);
    resetDragStatus();
    startAutorotate(rotation: TileRotation);
    resetAutorotate(keepRotation: boolean);
    resetCoordinateMapperCache();
}

export interface TileDropTarget {
    element: HTMLElement;
    grid: Grid;
    scale: number;
    triangleToScreenPosition(triangle: Triangle): Coord;
    screenPositionToGridPosition(clientPos: Coord): Coord;
    screenPositionToTriangleCoord(clientPos: Coord): Coord;
    dropTile(source: TileDragSource, pair: TriangleOnScreenMatch): boolean;
}
