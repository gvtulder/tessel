import { isConvexPolygon } from "../geom/polygon/isConvexPolygon";
import { edgeToKey, Grid } from "../grid/Grid";
import { Tile, TileColor, TileSegment } from "../grid/Tile";
import { dist } from "../geom/math";

export type ScoredRegion = {
    origin: TileSegment;
    color: TileColor;
    tiles: Set<Tile>;
    segments: Set<TileSegment>;
    edges: { from: TileSegment; to: TileSegment }[];
    finished: boolean;
    points: number;
};

export interface Scorer {
    /**
     * Computes the score after placing the given tile.
     *
     * @param grid the grid
     * @param tile the last tile played
     * @param includeIncomplete return incomplete regions?
     * @returns the regions found from the tile
     */
    computeScores(
        grid: Grid,
        tile: Tile,
        includeIncomplete?: boolean,
    ): ScoredRegion[];
}

export class ConnectedSegmentScorer implements Scorer {
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
        for (const origin of tile.segments) {
            if (!visited.has(origin)) {
                const color = origin.color;
                const tilesInShape = new Set<Tile>();
                const segmentsInShape = new Set<TileSegment>();
                const edgesInShape: ScoredRegion["edges"] = [];

                const shape: ScoredRegion = {
                    origin: origin,
                    color: origin.color!,
                    tiles: tilesInShape,
                    segments: segmentsInShape,
                    edges: edgesInShape,
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
                            if (!visited.has(neighbor)) {
                                queue.push(neighbor);
                                visited.add(neighbor);
                            }
                            edgesInShape.push({ from: segment, to: neighbor });
                        }
                    }
                }
            }
        }

        for (const shape of shapes) {
            if (shape.finished) {
                // double points for shapes with four tiles or more
                shape.points =
                    (shape.tiles.size > 3 ? 2 : 1) * shape.tiles.size;
            }
        }

        if (includeIncomplete) {
            return shapes;
        } else {
            return shapes.filter((s) => s.finished);
        }
    }
}

export class FullTileScorer implements Scorer {
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

        const edges = [];
        for (let i = 0; i < tile.segments.length; i++) {
            edges.push({
                from: tile.segments[i],
                to: tile.segments[(i + 1) % tile.segments.length],
            });
        }

        // TODO origin, color etc. does not really make sense
        const shape: ScoredRegion = {
            origin: tile.segments[0],
            color: tile.segments[0].color!,
            tiles: new Set<Tile>([tile]),
            segments: new Set<TileSegment>(tile.segments),
            edges: edges,
            finished: true,
            points: 1,
        };
        shapes.push(shape);

        return shapes;
    }
}

export class ConvexShapeScorer implements Scorer {
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

            // TODO origin, color etc. does not really make sense
            // boundary would be more efficient
            const shape: ScoredRegion = {
                origin: tile.segments[0],
                color: tile.segments[0].color!,
                tiles: tiles,
                segments: segments,
                edges: [],
                finished: true,
                points: tiles.size,
            };
            shapes.push(shape);
        }

        return shapes;
    }
}

export class FullVertexScorer implements Scorer {
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

        for (const vertex of tile.vertices) {
            const corners = vertex.corners;
            if (corners.complete) {
                const tiles = new Set<Tile>();
                const shapeSegments = new Set<TileSegment>();

                for (const corner of corners) {
                    const segments = corner.tile.segments!;
                    shapeSegments.add(segments[corner.vertexIdx]);
                    shapeSegments.add(
                        segments[
                            (corner.vertexIdx + segments.length - 1) %
                                segments.length
                        ],
                    );
                    tiles.add(tile);
                }

                // TODO origin, color etc. does not really make sense
                const shape: ScoredRegion = {
                    origin: tile.segments[0],
                    color: tile.segments[0].color!,
                    tiles: tiles,
                    segments: shapeSegments,
                    edges: [],
                    finished: true,
                    points: shapeSegments.size / 2,
                };
                shapes.push(shape);
            }
        }

        return shapes;
    }
}
