import { TileOnScreenMatch } from "./TileDisplay";
import { Tile } from "../../grid/Tile";
import { DEBUG } from "../../settings";
import { Grid } from "../../grid/Grid";
import { GridDisplay } from "./GridDisplay";
import { TransformComponent } from "../../geom/Transform";
import { Point } from "../../geom/math";
import { Shape } from "../../grid/Shape";
import { DragHandler, DragHandlerEvent } from "../shared/DragHandler";

export const MAX_TILE_DROP_POINT_DIST = 0.31;
export const MAX_TILE_AUTOROTATE_POINT_DIST = 0.5;
export const MAX_TILE_SNAP_POINT_DIST = 0.3;

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

    currentTranslate?: string;
    currentScale?: string;

    constructor(dropTarget: TileDropTarget) {
        super();
        this.dropTarget = dropTarget;
        this.sources = [];
    }

    destroy() {
        // nothing to do
    }

    addSource(source: TileDragSource) {
        this.sources.push(source);

        const context: TileDragSourceContext = {
            source: source,
            autorotateCurrentTarget: null,
            autorotateTimeout: null,
            autorotateCache: new Map<Tile, TileRotationSet>(),
            draggable: source.getDraggable(),
            position: { x: 0, y: 0, dx: 0, dy: 0 },
            dragCenterOffset: { x: 0, y: 0 },
        };

        const dragHandler = source.getDraggable();
        dragHandler.onDragStart = (evt: DragHandlerEvent) =>
            this.onDragStart(context, evt);
        dragHandler.onDragMove = (evt: DragHandlerEvent) =>
            this.onDragMove(context, evt);
        dragHandler.onDragEnd = (evt: DragHandlerEvent) =>
            this.onDragEnd(context, evt);

        /*
        context.draggable.draggable({
            listeners: {
                start: (evt: DragEvent) => this.onDragStart(context, evt),
                move: (evt: DragEvent) => this.onDragMove(context, evt),
                end: (evt: DragEvent) => this.onDragEnd(context, evt),
            },
        });
        */

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
        for (const s of this.sources) {
            if (s !== context.source) s.resetDragStatus();
        }
        context.source.startDrag();
        evt.target.style.willChange = "rotate scale translate";
        evt.target.style.translate = this.currentTranslate = `0px 0px`;
        evt.target.style.scale =
            this.currentScale = `${this.dropTarget.scale / context.source.gridDisplay.scale}`;
        context.source.dragTransform.dx = 0;
        context.source.dragTransform.dy = 0;
        context.source.dragTransform.scale =
            this.dropTarget.scale / context.source.gridDisplay.scale;
        context.dragCenterOffset.x =
            evt.handler.clientXstart -
            (context.source.baseTransform.dx || 0) -
            (context.source.dragTransform.originX || 0);
        context.dragCenterOffset.y =
            evt.handler.clientYstart -
            (context.source.baseTransform.dy || 0) -
            (context.source.dragTransform.originY || 0);
        context.position.x = 0;
        context.position.y = 0;
        context.position.dx = 0;
        context.position.dy = 0;
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
    ): { newTranslate: string; newScale: string } {
        context.position.dx += evt.dx;
        context.position.dy += evt.dy;

        // gradually adjust scale and center while dragging from the stack
        const distance = Math.hypot(context.position.dx, context.position.dy);
        const factor = Math.min(1, distance / 100);

        context.position.x =
            context.position.dx + factor * context.dragCenterOffset.x;
        context.position.y =
            context.position.dy + factor * context.dragCenterOffset.y;
        const newTranslate = `${Math.round(context.position.x)}px ${Math.round(context.position.y)}px`;
        if (updateTransform && this.currentTranslate != newTranslate) {
            evt.target.style.translate = this.currentTranslate = newTranslate;
        }
        const scale =
            1 +
            factor *
                (this.dropTarget.scale / context.source.gridDisplay.scale - 1);
        const newScale = `${scale.toFixed(3)}`;
        if (updateTransform && this.currentScale != newScale) {
            evt.target.style.scale = this.currentScale = newScale;
        }
        context.source.dragTransform.dx = context.position.x;
        context.source.dragTransform.dy = context.position.y;
        context.source.dragTransform.scale =
            this.dropTarget.scale / context.source.gridDisplay.scale;

        return { newTranslate, newScale };
    }

    onDragEnd(context: TileDragSourceContext, evt: DragHandlerEvent): boolean {
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
        context.position.dx = 0;
        context.position.dy = 0;
        context.position.x = 0;
        context.position.y = 0;
        evt.target.style.willChange = "";
        evt.target.style.translate =
            this.currentTranslate = `${context.position.x}px ${context.position.y}px`;
        evt.target.style.scale = this.currentScale = "";
        context.source.dragTransform.dx = 0;
        context.source.dragTransform.dy = 0;
        context.source.dragTransform.scale = 0;
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

export type TileDragSourceContext = {
    source: TileDragSource;
    autorotateCurrentTarget: Tile | null;
    autorotateTimeout: number | null;
    autorotateCache: Map<Tile, TileRotationSet>;
    draggable: DragHandler;
    position: { x: number; y: number; dx: number; dy: number };
    dragCenterOffset: { x: number; y: number };
};

export interface TileDragSource {
    gridDisplay: GridDisplay;
    baseTransform: TransformComponent;
    dragTransform: TransformComponent;
    tile: Tile | null;
    indexOnStack?: number;
    getDraggable(): DragHandler;
    startDrag(): void;
    endDrag(successful: boolean): void;
    resetDragStatus(): void;
    startAutorotate(rotation: TileRotationSet): void;
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
