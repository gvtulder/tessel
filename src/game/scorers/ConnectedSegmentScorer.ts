import { Grid } from "../../grid/Grid";
import { Tile, TileSegment } from "../../grid/Tile";
import { Scorer, ScoredRegion } from "./Scorer";

export class ConnectedSegmentScorer implements Scorer {
    name = "Connected segments";

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
