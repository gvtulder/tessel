/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PlaceholderTile, TileType } from "../../grid/Tile";
import { DEBUG } from "../../settings";
import {
    MAX_TILE_AUTOROTATE_POINT_DIST,
    MAX_TILE_START_SNAP_POINT_DIST,
    MAX_TILE_END_SNAP_POINT_DIST,
    TileDragController,
    TileDragSourceContext,
} from "../grid/TileDragController";
import { MainGridDisplay } from "./MainGridDisplay";
import { edgeToAngle } from "../../geom/math";
import { S, SVG } from "../shared/svg";
import { DragHandlerEvent } from "../shared/DragHandler";

export class MainGridTileDragController extends TileDragController {
    autorotate: boolean;
    hints: boolean;
    snap: boolean;

    currentlySnapped: boolean;

    debugPoints?: SVGCircleElement[];

    constructor(dropTarget: MainGridDisplay) {
        super(dropTarget);

        this.autorotate = false;
        this.hints = false;
        this.snap = true;

        this.currentlySnapped = false;

        if (DEBUG.SHOW_DEBUG_POINTS_WHILE_DRAGGING) {
            // debug
            this.debugPoints = [];
            for (let i = 0; i < 4; i++) {
                const p = SVG("circle", null, dropTarget.svgGrid, {
                    cx: "0",
                    cy: "0",
                    r: `${S * 0.05}`,
                    fill: "transparent",
                });
                this.debugPoints.push(p);
            }
        }
    }

    onDragStart(context: TileDragSourceContext, evt: DragHandlerEvent) {
        super.onDragStart(context, evt);
        if (!context.source.tile) return;

        this.currentlySnapped = false;

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
    ): { newTranslate: string; newScale: string } | null {
        let res = super.onDragMove(context, evt, false);
        if (!res) return null;

        const moved =
            evt.dx > -10 && evt.dx < 10 && evt.dy > -10 && evt.dy < 10;
        if (moved || this.currentlySnapped) {
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
                        let step = 0;
                        const fn = () => {
                            context.source.startAutorotate(rotation, step);
                            // if there is more than one rotation that fits,
                            // rotate to the next option after a short delay
                            step++;
                            context.autorotateTimeout = window.setTimeout(
                                fn,
                                3000,
                            );
                        };
                        context.autorotateTimeout = window.setTimeout(fn, 100);
                    }
                }
            } else {
                // cancel the autorotation
                context.autorotateCurrentTarget = null;
                if (context.autorotateTimeout) {
                    window.clearTimeout(context.autorotateTimeout);
                    context.autorotateTimeout = null;
                }
                /*
                context.autorotateTimeout = window.setTimeout(() => {
                    // source.resetAutorotate();
                }, 100);
                */
            }
        }

        // snapping?
        if (this.snap) {
            let snapping = false;
            if (
                match &&
                match.dist <
                    (this.currentlySnapped
                        ? MAX_TILE_END_SNAP_POINT_DIST
                        : MAX_TILE_START_SNAP_POINT_DIST) &&
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
                    snapping = true;
                }
            }
            this.currentlySnapped = snapping;
        }

        return { newTranslate: newTranslate, newScale: newScale };
    }

    onDragEnd(context: TileDragSourceContext, evt: DragHandlerEvent): boolean {
        const successful = super.onDragEnd(context, evt);

        // reset
        context.autorotateCache.clear();
        context.source.resetAutorotate(successful);
        if (context.autorotateTimeout)
            window.clearTimeout(context.autorotateTimeout);
        this.currentlySnapped = false;

        for (const tsd of (
            this.dropTarget as MainGridDisplay
        ).tileDisplays.values()) {
            tsd.removeHighlightHint();
        }

        return successful;
    }
}
