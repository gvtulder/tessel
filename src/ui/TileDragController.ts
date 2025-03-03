import type { Interactable, DragEvent } from "@interactjs/types";
import "@interactjs/auto-start";
import "@interactjs/actions/drag";

import { TileOnScreenMatch } from "./TileDisplay";
import { PlaceholderTile, Tile, TileType } from "../geom/Tile";
import { GameController } from "./GameController";
import { DEBUG } from "../settings";
import { dist } from "../utils";
import { Grid } from "../geom/Grid";
import { GridDisplay } from "./GridDisplay";
import { Point } from "../geom/math";
import { Shape } from "../geom/Shape";

export const MAX_TILE_DROP_POINT_DIST = 0.2;
export const MAX_TILE_AUTOROTATE_POINT_DIST = 0.5;
export const MAX_TILE_SNAP_POINT_DIST = 0.2;

export type TileRotationSet = {
    readonly targetRotations: readonly number[];
    readonly relativeRotationAngles: readonly number[];
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
            autorotateCache: new Map<Tile, TileRotationSet>(),
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
        let moved = false;
        const newTranslate = `${Math.round(context.position.x)}px ${Math.round(context.position.y)}px`;
        if (evt.target.style.translate != newTranslate) {
            evt.target.style.translate = newTranslate;
            moved = true;
        }
        const newScale = `${(this.dropTarget.scale / context.source.gridDisplay.scale).toFixed(3)}`;
        if (evt.target.style.scale != newScale) {
            evt.target.style.scale = newScale;
            moved = true;
        }
        if (moved) {
            context.source.resetCoordinateMapperCache();
        }
    }

    onDragEnd(context: TileDragSourceContext, evt: DragEvent): boolean {
        context.source.resetCoordinateMapperCache();

        const match = this.mapToFixedTile(context);

        let successful = false;
        if (match) {
            successful = this.dropTarget.dropTile(context.source, {
                fixed: match.tile,
                moving: context.source.tile,
                offset: match.offset,
            });
        }
        console.log(
            "DROPPED",
            match,
            context.source.tile,
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

    protected mapToFixedTile(
        context: TileDragSourceContext,
        matchCentroidOnly?: boolean,
        distance?: number,
    ) {
        const movingTile = context.source.tile;
        const movingPoly = context.source.gridDisplay.gridToScreenPositions(
            movingTile.polygon.vertices,
        );
        // match moving to fixed
        const fixedPoly = this.dropTarget.screenToGridPositions(movingPoly);
        return this.dropTarget.findMatchingTile(
            fixedPoly,
            distance || MAX_TILE_DROP_POINT_DIST,
            true,
            movingTile.shape,
            matchCentroidOnly,
        );
    }
}

export type TileDragSourceContext = {
    source: TileDragSource;
    autorotateCurrentTarget: Tile;
    autorotateTimeout: number;
    autorotateCache: Map<Tile, TileRotationSet>;
    draggable: Interactable;
    position: { x: 0; y: 0 };
};

export interface TileDragSource {
    gridDisplay: GridDisplay;
    tile: Tile;
    rotation: TileRotationSet;
    indexOnStack?: number;
    getDraggable(): Interactable;
    startDrag();
    endDrag(successful: boolean);
    resetDragStatus();
    startAutorotate(rotation: TileRotationSet);
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
     * @param shape only match tiles with this shape
     * @param matchCentroidOnly set to true match on centroid, not all points
     * @returns the best matching tile and offset, or null
     */
    findMatchingTile(
        points: readonly Point[],
        minOverlap: number,
        includePlaceholders?: boolean,
        shape?: Shape,
        matchCentroidOnly?: boolean,
    ): { tile: Tile; offset: number; dist: number };

    dropTile(source: TileDragSource, pair: TileOnScreenMatch): boolean;
}
