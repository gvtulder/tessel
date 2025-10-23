/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { dist } from "../../geom/math";
import { isConvexPolygon } from "../../geom/polygon/isConvexPolygon";
import { Grid, edgeToKey } from "../../grid/Grid";
import { Tile, TileSegment } from "../../grid/Tile";
import { Scorer, ScoredRegion } from "./Scorer";

export class ConvexShapeScorer extends Scorer {
    static friendlyName = "Count convex shapes";

    static create() {
        return new ConvexShapeScorer();
    }

    computeScores(
        grid: Grid,
        tile: Tile,
        includeIncomplete?: boolean,
    ): ScoredRegion[] {
        const rings = grid.rings.rings;

        const shapes: ScoredRegion[] = [];

        // TODO proper checking for holes
        if (rings.length > 1) return [];

        for (const ring of rings) {
            if (!isConvexPolygon(ring)) continue;

            const edgeKey = edgeToKey(ring[0], ring[1]);
            const edge = grid.edges.get(edgeKey);
            if (!edge) {
                throw new Error("edge not found");
            }
            // TODO this doesn't always work
            if (dist(edge.a.point, ring[0]) < 1e-6) {
                if (!edge.tileA) {
                    // no tile on the inside: this is a hole
                    continue;
                }
            } else {
                if (!edge.tileB) {
                    // no tile on the inside: this is a hole
                    continue;
                }
            }

            const tile = edge.tileA || edge.tileB;
            if (!tile || !tile.segments) {
                throw new Error("no tile connected to edge");
            }
            const tiles = new Set<Tile>([tile!]);
            const segments = new Set<TileSegment>();
            const queue = [tile.segments[0]];
            while (queue.length > 0) {
                const s = queue.pop()!;
                for (const n of s.getNeighbors(true, false)) {
                    if (!segments.has(n)) {
                        tiles.add(n.tile);
                        segments.add(n);
                        queue.push(n);
                    }
                }
            }

            const shape: ScoredRegion = {
                origin: tile.segments[0],
                color: tile.segments[0].color!,
                tiles: tiles,
                segments: segments,
                boundary: ring,
                finished: true,
                points: tiles.size,
                pointsAreVariable: true,
            };
            shapes.push(shape);
        }

        return shapes;
    }
}
