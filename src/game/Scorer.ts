import { Tile, TileColor, TileSegment } from "../grid/Tile";

export type ScoredRegion = {
    origin: TileSegment;
    color: TileColor;
    tiles: Set<Tile>;
    segments: Set<TileSegment>;
    edges: { from: TileSegment; to: TileSegment }[];
    finished: boolean;
    points: number;
};

export class Scorer {
    /**
     * Computes the score after placing the given tile.
     *
     * @param tile the last tile played
     * @param includeIncomplete return incomplete regions?
     * @returns the regions found from the tile
     */
    static computeScores(
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
