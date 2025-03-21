import { Grid } from "../../grid/Grid";
import { Tile, TileColor, TileSegment } from "../../grid/Tile";

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
     * A friendly name for the scorer.
     */
    name: string;

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
