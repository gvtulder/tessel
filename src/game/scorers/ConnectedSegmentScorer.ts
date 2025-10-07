/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { computeRing } from "../../grid/Rings";
import { Grid } from "../../grid/Grid";
import { Tile, TileSegment } from "../../grid/Tile";
import { Scorer, ScoredRegion } from "./Scorer";

export class ConnectedSegmentScorer extends Scorer {
    static friendlyName = "Score connected segments";

    static create() {
        return new ConnectedSegmentScorer();
    }

    computeScores(
        grid: Grid,
        tile: Tile,
        includeIncomplete?: boolean,
    ): ScoredRegion[] {
        const visited = new Set<TileSegment>();

        const shapes: ScoredRegion[] = [];

        if (!tile.segments) {
            throw new Error("tile has no segments");
        }

        // visit each segment of the shape in turn
        const segmentsToCheck = [...tile.segments];
        while (segmentsToCheck.length > 0) {
            const origin = segmentsToCheck.shift()!;
            if (!visited.has(origin)) {
                const color = origin.color;
                const tilesInShape = new Set<Tile>();
                const segmentsInShape = new Set<TileSegment>();

                const shape: ScoredRegion = {
                    origin: origin,
                    color: origin.color!,
                    tiles: tilesInShape,
                    segments: segmentsInShape,
                    boundary: [],
                    finished: true,
                    points: 0,
                };
                shapes.push(shape);

                // start at origin
                const queue: TileSegment[] = [origin];
                visited.add(origin);

                while (queue.length > 0) {
                    // process segment from queue
                    const segment = queue.pop()!;
                    tilesInShape.add(segment.tile);
                    segmentsInShape.add(segment);

                    // add internal and external neighbors
                    for (const neighbor of segment.getNeighbors(true, true)) {
                        if (!neighbor || !neighbor.color) {
                            shape.finished = false;
                        } else if (neighbor.color === color) {
                            // add the neighbor to the shape and explore further
                            if (!visited.has(neighbor)) {
                                queue.push(neighbor);
                                visited.add(neighbor);
                            }
                        } else if (
                            segment.tile === tile &&
                            neighbor.tile !== tile
                        ) {
                            // check the neighboring segments of the current tile,
                            // in case any of their shapes are now closed
                            // (this may happen with the DifferentEdgeColorsRuleSet)
                            segmentsToCheck.push(neighbor);
                        }
                    }
                }
            }
        }

        for (const shape of shapes) {
            shape.boundary = computeRing(
                [...shape.segments!].map((s) => s.polygon.vertices),
            );
            if (shape.finished) {
                // double points for shapes with four tiles or more
                shape.points =
                    (shape.tiles!.size > 3 ? 2 : 1) * shape.tiles!.size;
            }
        }

        if (includeIncomplete) {
            return shapes;
        } else {
            return shapes.filter((s) => s.finished);
        }
    }
}
