import { computeRing } from "../../grid/Rings";
import { Grid } from "../../grid/Grid";
import { Tile, TileSegment } from "../../grid/Tile";
import { Scorer, ScoredRegion } from "./Scorer";

export class FullVertexScorer extends Scorer {
    static friendlyName = "Score full vertices";

    static create() {
        return new FullVertexScorer();
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

                const shape: ScoredRegion = {
                    origin: tile.segments[0],
                    color: tile.segments[0].color!,
                    tiles: tiles,
                    segments: shapeSegments,
                    boundary: computeRing(
                        [...shapeSegments].map((s) => s.polygon.vertices),
                    ),
                    finished: true,
                    points: shapeSegments.size / 2,
                };
                shapes.push(shape);
            }
        }

        return shapes;
    }
}
