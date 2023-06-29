import type { Interactable, DragEvent } from '@interactjs/types';

import { TriangleOnScreenMatch } from "./TileDisplay.js";
import { Tile, TileRotation, TileType } from 'src/grid/Tile.js';
import { GameController } from './GameController.js';
import { Coord, Triangle } from 'src/grid/Triangle.js';
import { DEBUG } from 'src/settings.js';
import { dist } from 'src/utils.js';
import { Grid } from 'src/grid/Grid.js';
import { TileDragController, TileDragSourceContext } from './TileDragController.js';
import { MainGridDisplay } from './MainGridDisplay.js';

export class MainGridTileDragController extends TileDragController {
    dropTarget : MainGridDisplay;
    autorotate : boolean;
    hints : boolean;

    constructor(dropTarget : MainGridDisplay) {
        super(dropTarget);
    }

    onDragStart(context : TileDragSourceContext, evt : DragEvent) {
        super.onDragStart(context, evt);

        // precompute the placeholder tiles where this tile would fit
        if (this.autorotate || this.hints || this.snap) {
            context.autorotateCache.clear();
            // find possible locations where this tile would fit
            for (const placeholder of this.dropTarget.grid.placeholderTiles) {
                const rotation = placeholder.computeRotationToFit(context.source.tile, context.source.rotation);
                if (rotation) {
                    // this tile would fit
                    context.autorotateCache.set(placeholder, rotation);
                }
            }
            // if hints are enabled, highlight possible/impossible tiles
            if (this.hints) {
                for (const tsd of this.dropTarget.tileDisplays.values()) {
                    if (tsd.tile.type === TileType.Placeholder) {
                        tsd.highlightHint(context.autorotateCache.has(tsd.tile));
                    }
                }
            }
            console.log(context.autorotateCache);
        }
    }

    onDragMove(context : TileDragSourceContext, evt : DragEvent) {
        super.onDragMove(context, evt);

        if (this.autorotate) {
            // figure out where we are
            const movingTriangle = context.source.tile.triangles[0];
            const movingPos = context.source.gridDisplay.triangleToScreenPosition(movingTriangle)
            // match moving to fixed
            const fixedTriangleCoord = this.dropTarget.screenPositionToTriangleCoord(movingPos);
            const fixedTriangle = this.dropTarget.grid.getTriangle(...fixedTriangleCoord);

            // triangle matched?
            if (fixedTriangle && fixedTriangle.placeholder) {
                if (context.autorotateCurrentTarget !== fixedTriangle.placeholder) {
                    // autorotate after a small delay
                    context.autorotateCurrentTarget = fixedTriangle.placeholder;
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
    }

    onDragEnd(context : TileDragSourceContext, evt : DragEvent) : boolean {
        const succesful = super.onDragEnd(context, evt);

        // reset
        context.autorotateCache.clear();
        context.source.resetAutorotate(succesful);

        for (const tsd of this.dropTarget.tileDisplays.values()) {
            tsd.removeHighlightHint();
        }

        return succesful;
    }
}
