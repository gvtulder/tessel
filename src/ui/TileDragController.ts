import type { Interactable, DragEvent } from "@interactjs/types";

import { TileOnScreenMatch } from "./TileDisplay";
import { Tile, TileType } from "../geom/Tile";
import { GameController } from "./GameController";
import { DEBUG } from "../settings";
import { dist } from "../utils";
import { Grid } from "../geom/Grid";
import { GridDisplay } from "./GridDisplay";
import { Point } from "../geom/math";

const MAX_TILE_DROP_DIST = 0.3;

export type TileRotation = {
    readonly angle: number;
};

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
                    const cursorPos: Point = { x: evt.clientX, y: evt.clientY };
                    console.log(
                        "Mouse cursor:",
                        cursorPos,
                        "Grid coordinates:",
                        this.dropTarget.screenToGridPosition(cursorPos),
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

        // TODO snap
        /*
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
        */
    }

    onDragEnd(context: TileDragSourceContext, evt: DragEvent): boolean {
        context.source.resetCoordinateMapperCache();

        // figure out where we are
        const movingTile = context.source.tile;
        const movingPoly = context.source.gridDisplay.gridToScreenPositions(
            movingTile.polygon.vertices,
        );
        // match moving to fixed
        const fixedPoly = this.dropTarget.screenToGridPositions(movingPoly);
        const match = this.dropTarget.findMatchingTile(
            fixedPoly,
            MAX_TILE_DROP_DIST,
            true,
        );

        let successful = false;
        if (match) {
            successful = this.dropTarget.dropTile(context.source, {
                fixed: match.tile,
                moving: movingTile,
                offset: match.offset,
            });
        }
        console.log(
            "DROPPED",
            match,
            movingTile,
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
    position: { x: 0; y: 0 };
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

    /**
     * Maps the grid coordinates to screen coordinates.
     */
    gridToScreenPosition(point: Point): Point;
    /**
     * Maps the grid coordinates to screen coordinates.
     */
    gridToScreenPositions(point: readonly Point[]): Point[];
    /**
     * Maps the screen coordinates to grid coordinates.
     */
    screenToGridPosition(point: Point): Point;
    /**
     * Maps the screen coordinates to grid coordinates.
     */
    screenToGridPositions(point: readonly Point[]): Point[];
    /**
     * Finds the best overlapping tile for the given polygon points.
     * @param points the vertices of a polygon
     * @param minOverlap the minimal overlap proportion
     * @param includePlaceholders set to true to match placeholder tiles
     * @returns the best matching tile and offset, or null
     */
    findMatchingTile(
        points: readonly Point[],
        minOverlap: number,
        includePlaceholders?: boolean,
    ): { tile: Tile; offset: number; dist: number };

    dropTile(source: TileDragSource, pair: TileOnScreenMatch): boolean;
}
