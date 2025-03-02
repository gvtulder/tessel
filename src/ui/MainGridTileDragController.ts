import type { DragEvent } from "@interactjs/types";

import { TileOnScreenMatch } from "./TileDisplay";
import { Tile, TileType } from "../geom/Tile";
import { GameController } from "./GameController";
import { DEBUG } from "../settings";
import { dist } from "../utils";
import { Grid } from "../geom/Grid";
import {
    TileDragController,
    TileDragSourceContext,
} from "./TileDragController";
import { MainGridDisplay } from "./MainGridDisplay";

export class MainGridTileDragController extends TileDragController {
    dropTarget: MainGridDisplay;
    autorotate: boolean;
    hints: boolean;

    debugPoints: SVGCircleElement[];

    constructor(dropTarget: MainGridDisplay) {
        super(dropTarget);

        if (DEBUG.SHOW_DEBUG_POINTS_WHILE_DRAGGING) {
            // debug
            this.debugPoints = [];
            for (let i = 0; i < 4; i++) {
                const p = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle",
                );
                p.setAttribute("cx", "0");
                p.setAttribute("cy", "0");
                p.setAttribute("r", "0.05");
                p.setAttribute("fill", "transparent");
                this.dropTarget.svgGrid.appendChild(p);
                this.debugPoints.push(p);
            }
        }
    }

    onDragStart(context: TileDragSourceContext, evt: DragEvent) {
        super.onDragStart(context, evt);

        // TODO implement autorotate
        /*
        // precompute the placeholder tiles where this tile would fit
        if (this.autorotate || this.hints || this.snap) {
            context.autorotateCache.clear();
            // find possible locations where this tile would fit
            for (const placeholder of this.dropTarget.grid.placeholderTiles) {
                const rotation = placeholder.computeRotationToFit(
                    context.source.tile,
                    context.source.rotation,
                );
                if (rotation) {
                    // this tile would fit
                    context.autorotateCache.set(placeholder, rotation);
                }
            }
            // if hints are enabled, highlight possible/impossible tiles
            if (this.hints) {
                for (const tsd of this.dropTarget.tileDisplays.values()) {
                    if (tsd.tile.type === TileType.Placeholder) {
                        tsd.highlightHint(
                            context.autorotateCache.has(tsd.tile),
                        );
                    }
                }
            }
            console.log(context.autorotateCache);
        }
        */
    }

    onDragMove(context: TileDragSourceContext, evt: DragEvent) {
        super.onDragMove(context, evt);

        if (DEBUG.SHOW_DEBUG_POINTS_WHILE_DRAGGING) {
            // TODO debugging
            // figure out where we are
            const movingTile = context.source.tile;
            const movingPoly = context.source.gridDisplay.gridToScreenPositions(
                movingTile.polygon.vertices,
            );
            // match moving to fixed
            const fixedPoly = this.dropTarget.screenToGridPositions(movingPoly);
            for (
                let i = 0;
                i < Math.min(this.debugPoints.length, fixedPoly.length);
                i++
            ) {
                this.debugPoints[i].setAttribute("cx", `${fixedPoly[i].x}`);
                this.debugPoints[i].setAttribute("cy", `${fixedPoly[i].y}`);
                this.debugPoints[i].setAttribute("fill", "black");
            }
        }

        // implement autorotate
        /*
        if (this.autorotate) {
            // figure out where we are
            const movingTriangle = context.source.tile.triangles[0];
            const movingPos =
                context.source.gridDisplay.triangleToScreenPosition(
                    movingTriangle,
                );
            // match moving to fixed
            const fixedTriangleCoord =
                this.dropTarget.screenPositionToTriangleCoord(movingPos);
            if (!fixedTriangleCoord) return;
            const fixedTriangle = this.dropTarget.grid.getTriangle(
                ...fixedTriangleCoord,
            );

            // triangle matched?
            if (fixedTriangle && fixedTriangle.placeholders) {
                // find the best placeholder
                // compute the screen center of each placeholder tile
                const placeholdersWithCenterDist =
                    fixedTriangle.placeholders.map(
                        (placeholder) =>
                            [
                                placeholder,
                                dist(
                                    this.dropTarget.coordinateMapper.gridToScreen(
                                        [
                                            (placeholder.right +
                                                placeholder.left) /
                                                2,
                                            (placeholder.bottom +
                                                placeholder.top) /
                                                2,
                                        ],
                                    ),
                                    [evt.clientX, evt.clientY],
                                ),
                            ] as [Tile, number],
                    );
                // sort by distance to the mouse cursor
                placeholdersWithCenterDist.sort((a, b) => a[1] - b[1]);
                // use the closest placeholder
                const placeholder = placeholdersWithCenterDist[0][0];

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
            // console.log('MOVE', 'closestPair', closestPair);
        }
        */
    }

    onDragEnd(context: TileDragSourceContext, evt: DragEvent): boolean {
        const successful = super.onDragEnd(context, evt);

        // reset
        context.autorotateCache.clear();
        context.source.resetAutorotate(successful);

        for (const tsd of this.dropTarget.tileDisplays.values()) {
            tsd.removeHighlightHint();
        }

        return successful;
    }
}
