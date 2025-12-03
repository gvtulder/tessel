/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { TileOnScreenMatch } from "./TileDisplay";
import { Tile } from "../../grid/Tile";
import { DEBUG } from "../../settings";
import { Grid } from "../../grid/Grid";
import { GridDisplay } from "./GridDisplay";
import { TransformComponent } from "../../geom/Transform";
import { Point } from "../../geom/math";
import { Shape } from "../../grid/Shape";
import { DragHandler, DragHandlerEvent } from "../shared/DragHandler";

// maximum distance to accept tile drops
export const MAX_TILE_DROP_POINT_DIST = 0.4;
// maximum distance to start autorotation
export const MAX_TILE_AUTOROTATE_POINT_DIST = 0.5;
// maximum distance to start snapping
export const MAX_TILE_START_SNAP_POINT_DIST = 0.3;
// minimum distance at which a snapped tile is released
export const MAX_TILE_END_SNAP_POINT_DIST = 0.35;

export type TileRotationSet = {
    readonly targetRotations: readonly number[];
    readonly relativeRotationAngles: readonly number[];
};

export class TileDragEvent extends Event {
    tileDragSource: TileDragSource;
    constructor(type: string, tileDragSource: TileDragSource) {
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
    contexts: TileDragSourceContext[];

    constructor(dropTarget: TileDropTarget) {
        super();
        this.dropTarget = dropTarget;
        this.sources = [];
        this.contexts = [];
    }

    destroy() {
        // nothing to do
    }

    addSource(source: TileDragSource) {
        this.sources.push(source);

        const context = new TileDragSourceContext(source);
        this.contexts.push(context);

        const dragHandler = source.draggable;
        dragHandler.onDragStart = (evt: DragHandlerEvent) =>
            this.onDragStart(context, evt);
        dragHandler.onDragMove = (evt: DragHandlerEvent) =>
            this.onDragMove(context, evt);
        dragHandler.onDragEnd = (evt: DragHandlerEvent) =>
            this.onDragEnd(context, evt);

        if (DEBUG.LOG_MOUSE_POSITION) {
            this.dropTarget.element.addEventListener(
                "mouseover",
                (evt: MouseEvent) => {
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

    onDragStart(context: TileDragSourceContext, evt: DragHandlerEvent) {
        for (const c of this.contexts) {
            c.resetPositionSnapAndScale();
        }
        if (!context.source.tile) return;
        context.source.startDrag();
        context.resetPositionSnapAndScale();
        context.draggable.element.style.willChange = "rotate scale translate";
        context.dragCenterOffset.x =
            evt.handler.clientXstart -
            (context.source.baseTransform.dx || 0) -
            (context.source.dragTransform.originX || 0);
        context.dragCenterOffset.y =
            evt.handler.clientYstart -
            (context.source.baseTransform.dy || 0) -
            (context.source.dragTransform.originY || 0);
        this.dispatchEvent(
            new TileDragEvent(
                TileDragController.events.StartDrag,
                context.source,
            ),
        );
    }

    onDragMove(
        context: TileDragSourceContext,
        evt: DragHandlerEvent,
        updateTransform: boolean = true,
    ): boolean {
        if (!context.source.tile) return false;
        context.position.dx += evt.dx;
        context.position.dy += evt.dy;

        // gradually adjust scale and center while dragging from the stack
        const distance = Math.hypot(context.position.dx, context.position.dy);
        const factor = Math.min(1, distance / 100);

        context.updatePosition(
            context.position.dx + factor * context.dragCenterOffset.x,
            context.position.dy +
                factor * context.dragCenterOffset.y -
                (evt.event.pointerType == "touch" ? 30 : 0),
            updateTransform,
        );
        context.updateScale(
            1 +
                factor *
                    (this.dropTarget.scale / context.source.gridDisplay.scale -
                        1),
            updateTransform,
        );

        return true;
    }

    onDragEnd(context: TileDragSourceContext, evt: DragHandlerEvent): boolean {
        if (!context.source.tile) return false;
        const match = this.mapToFixedTile(context);

        let successful = false;
        if (match && context.source.tile) {
            successful = this.dropTarget.dropTile(context.source, {
                fixed: match.tile,
                moving: context.source.tile,
                offset: match.offset!,
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
        context.resetPositionSnapAndScale();
        context.draggable.element.style.willChange = "";
        this.dispatchEvent(
            new TileDragEvent(
                TileDragController.events.EndDrag,
                context.source,
            ),
        );

        return successful;
    }

    protected mapToFixedTile(
        context: TileDragSourceContext,
        matchCentroidOnly?: boolean,
        distance?: number,
    ) {
        const movingTile = context.source.tile;
        if (!movingTile) return null;
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

export class TileDragSourceContext {
    source: TileDragSource;
    autorotateCurrentTarget: Tile | null;
    autorotateTimeout: number | null;
    autorotateCache: Map<Tile, TileRotationSet>;
    position: { x: number; y: number; dx: number; dy: number };
    snapPosition?: { x: number; y: number };
    scale: number;
    dragCenterOffset: { x: number; y: number };
    currentTranslate: string;
    currentScale: string;

    constructor(source: TileDragSource) {
        this.source = source;
        this.autorotateCurrentTarget = null;
        this.autorotateTimeout = null;
        this.autorotateCache = new Map<Tile, TileRotationSet>();
        this.position = { x: 0, y: 0, dx: 0, dy: 0 };
        this.scale = 1;
        this.dragCenterOffset = { x: 0, y: 0 };
        this.currentTranslate = "";
        this.currentScale = "";
    }

    get draggable(): DragHandler {
        return this.source.draggable;
    }

    resetDragStatus(): void {
        this.source.resetDragStatus();
        this.resetPositionSnapAndScale();
    }

    resetPositionSnapAndScale(updateTransform: boolean = true): void {
        this.resetPosition(false);
        this.resetSnapPosition(false);
        this.resetScale(false);
        if (updateTransform) {
            this.applyTransformUpdate();
        }
    }

    resetPosition(updateTransform: boolean = true): void {
        this.position.dx = 0;
        this.position.dy = 0;
        this.updatePosition(0, 0, updateTransform);
    }

    resetSnapPosition(updateTransform: boolean = true): void {
        this.snapPosition = undefined;
        if (updateTransform) this.applyTransformUpdate();
    }

    resetScale(updateTransform: boolean = true): void {
        this.updateScale(1, updateTransform);
    }

    updatePosition(
        x: number,
        y: number,
        updateTransform: boolean = true,
    ): void {
        this.position.x = x;
        this.position.y = y;
        this.source.dragTransform.dx = x;
        this.source.dragTransform.dy = y;
        if (updateTransform) this.applyTransformUpdate();
    }

    updateSnapPosition(x: number, y: number, updateTransform: boolean = true) {
        this.snapPosition = { x: x, y: y };
        if (updateTransform) this.applyTransformUpdate();
    }

    updateScale(scale: number, updateTransform: boolean = true): void {
        this.scale = scale;
        this.source.dragTransform.scale = scale;
        if (updateTransform) this.applyTransformUpdate();
    }

    applyTransformUpdate(): void {
        const x = this.snapPosition ? this.snapPosition.x : this.position.x;
        const y = this.snapPosition ? this.snapPosition.y : this.position.y;
        const newTranslate = `${Math.round(x)}px ${Math.round(y)}px`;
        if (newTranslate != this.currentTranslate) {
            this.draggable.element.style.translate = newTranslate;
            this.currentTranslate = newTranslate;
        }
        const newScale = this.scale.toFixed(4);
        if (newScale != this.currentScale) {
            this.draggable.element.style.scale = newScale;
            this.currentScale = newScale;
        }
    }
}

export interface TileDragSource {
    gridDisplay: GridDisplay;
    baseTransform: TransformComponent;
    dragTransform: TransformComponent;
    tile: Tile | null;
    indexOnStack?: number;
    get draggable(): DragHandler;
    startDrag(): void;
    endDrag(successful: boolean): void;
    resetDragStatus(): void;
    startAutorotate(rotation: TileRotationSet, step: number): void;
    resetAutorotate(keepRotation: boolean): void;
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
    ): {
        tile: Tile;
        offset?: number;
        dist: number;
        matchesPoints: boolean;
    } | null;

    dropTile(source: TileDragSource, pair: TileOnScreenMatch): boolean;
}
