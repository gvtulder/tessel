import { TileOnScreenMatch } from "../grid/TileDisplay";
import { PlaceholderTile, Tile, TileType } from "../../grid/Tile";
import { GameController } from "../GameController";
import { DEBUG } from "../../settings";
import { Grid } from "../../grid/Grid";
import {
    MAX_TILE_AUTOROTATE_POINT_DIST,
    MAX_TILE_SNAP_POINT_DIST,
    TileDragController,
    TileDragSourceContext,
} from "../grid/TileDragController";
import { MainGridDisplay } from "./MainGridDisplay";
import { angleDist, edgeToAngle, TWOPI } from "../../geom/math";
import { SVG } from "../svg";
import { DragHandlerEvent } from "../DragHandler";

export class MainGridTileDragController extends TileDragController {
    autorotate: boolean;
    hints: boolean;
    snap: boolean;

    debugPoints?: SVGCircleElement[];

    constructor(dropTarget: MainGridDisplay) {
        super(dropTarget);

        this.autorotate = false;
        this.hints = false;
        this.snap = false;

        if (DEBUG.SHOW_DEBUG_POINTS_WHILE_DRAGGING) {
            // debug
            this.debugPoints = [];
            for (let i = 0; i < 4; i++) {
                const p = SVG("circle", null, dropTarget.svgGrid, {
                    cx: "0",
                    cy: "0",
                    r: "0.05",
                    fill: "transparent",
                });
                this.debugPoints.push(p);
            }
        }
    }

    onDragStart(context: TileDragSourceContext, evt: DragHandlerEvent) {
        super.onDragStart(context, evt);

        const dropTarget = this.dropTarget as MainGridDisplay;

        // measure the current top-left coordinate of the grid
        // this may be non-zero if the buttons are on the top part of the screen
        const rect = dropTarget.element.getBoundingClientRect();
        dropTarget.baseTransform.dx = rect.left;
        dropTarget.baseTransform.dy = rect.top;

        // precompute the placeholder tiles where this tile would fit
        if (this.autorotate || this.hints || this.snap) {
            context.autorotateCache.clear();
            // find possible locations where this tile would fit
            const sourceTile = context.source.tile!;
            for (const placeholder of dropTarget.grid.placeholders) {
                if (sourceTile.shape === placeholder.shape) {
                    const rotations =
                        this.dropTarget.grid.checkColorsWithRotation(
                            placeholder,
                            sourceTile.colors!,
                        );
                    if (rotations.length > 0) {
                        // this tile would fit
                        const sourceEdges = sourceTile.polygon.edges;
                        const targetEdges = placeholder.polygon.edges;
                        const tileRotationSet = {
                            targetRotations: rotations,
                            relativeRotationAngles: rotations.map(
                                (r, i) =>
                                    edgeToAngle(targetEdges[i]) -
                                    edgeToAngle(
                                        sourceEdges[
                                            (i + r) % targetEdges.length
                                        ],
                                    ),
                            ),
                        };
                        context.autorotateCache.set(
                            placeholder,
                            tileRotationSet,
                        );
                    }
                }
            }
            // if hints are enabled, highlight possible/impossible tiles
            if (this.hints) {
                for (const tsd of dropTarget.tileDisplays.values()) {
                    if (tsd.tile.tileType === TileType.Placeholder) {
                        tsd.highlightHint(
                            context.autorotateCache.has(tsd.tile),
                        );
                    }
                }
            }
            console.log("autorotate map", [...context.autorotateCache]);
        }
    }

    onDragMove(
        context: TileDragSourceContext,
        evt: DragHandlerEvent,
        updateTransform: boolean = true,
    ): { newTranslate: string; newScale: string } {
        let res = super.onDragMove(context, evt, false);

        if (evt.dx > -10 && evt.dx < 10 && evt.dy > -10 && evt.dy < 10) {
            res = this.computeDragMove(
                res.newTranslate,
                res.newScale,
                context,
                evt,
            );
        }

        if (updateTransform && this.currentTranslate != res.newTranslate) {
            evt.target.style.translate = this.currentScale = res.newTranslate;
        }
        if (updateTransform && this.currentScale != res.newScale) {
            evt.target.style.scale = this.currentScale = res.newScale;
        }

        return res;
    }

    private computeDragMove(
        newTranslate: string,
        newScale: string,
        context: TileDragSourceContext,
        evt: DragHandlerEvent,
    ): { newTranslate: string; newScale: string } {
        if (DEBUG.SHOW_DEBUG_POINTS_WHILE_DRAGGING) {
            // figure out where we are
            const movingTile = context.source.tile!;
            const movingPoly = context.source.gridDisplay.gridToScreenPositions(
                movingTile.polygon.vertices,
            );
            // match moving to fixed
            const fixedPoly = this.dropTarget.screenToGridPositions(movingPoly);
            for (
                let i = 0;
                i < Math.min(this.debugPoints!.length, fixedPoly.length);
                i++
            ) {
                this.debugPoints![i].setAttribute("cx", `${fixedPoly[i].x}`);
                this.debugPoints![i].setAttribute("cy", `${fixedPoly[i].y}`);
                this.debugPoints![i].setAttribute("fill", "black");
            }
        }

        const match =
            this.autorotate || this.snap
                ? this.mapToFixedTile(
                      context,
                      true,
                      MAX_TILE_AUTOROTATE_POINT_DIST,
                  )
                : null;

        // implement autorotate
        if (this.autorotate) {
            if (
                match &&
                match.dist < MAX_TILE_AUTOROTATE_POINT_DIST &&
                match.tile instanceof PlaceholderTile
            ) {
                const placeholder = match.tile;
                if (context.autorotateCurrentTarget !== placeholder) {
                    // autorotate after a small delay
                    context.autorotateCurrentTarget = placeholder;
                    const rotation = context.autorotateCache.get(
                        context.autorotateCurrentTarget,
                    );
                    if (rotation) {
                        // this tile would fit
                        if (context.autorotateTimeout)
                            window.clearTimeout(context.autorotateTimeout);
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
        }

        // snapping?
        if (this.snap) {
            if (
                match &&
                match.dist < MAX_TILE_SNAP_POINT_DIST &&
                match.tile instanceof PlaceholderTile &&
                context.autorotateCache.has(match.tile)
            ) {
                if (this.autorotate || match.matchesPoints) {
                    const centerSnapTo = this.dropTarget.gridToScreenPosition(
                        match.tile.centroid,
                    );
                    const centerSnapFrom =
                        context.source.gridDisplay.gridToScreenPosition(
                            context.source.tile!.centroid,
                        );
                    const snap = {
                        x:
                            context.position.x +
                            centerSnapTo.x -
                            centerSnapFrom.x,
                        y:
                            context.position.y +
                            centerSnapTo.y -
                            centerSnapFrom.y,
                    };
                    newTranslate = `${Math.round(snap.x)}px ${Math.round(snap.y)}px`;
                }
            }
        }

        return { newTranslate: newTranslate, newScale: newScale };
    }

    onDragEnd(context: TileDragSourceContext, evt: DragHandlerEvent): boolean {
        const successful = super.onDragEnd(context, evt);

        // reset
        context.autorotateCache.clear();
        context.source.resetAutorotate(successful);

        for (const tsd of (
            this.dropTarget as MainGridDisplay
        ).tileDisplays.values()) {
            tsd.removeHighlightHint();
        }

        return successful;
    }
}
