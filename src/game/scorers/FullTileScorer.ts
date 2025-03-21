import { Grid } from "../../grid/Grid";
import { Tile, TileSegment } from "../../grid/Tile";
import { Scorer, ScoredRegion } from "./Scorer";

export class FullTileScorer implements Scorer {
    name = "Single tiles";

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
            finished: true,
            points: 1,
        };
        shapes.push(shape);

        return shapes;
    }
}
