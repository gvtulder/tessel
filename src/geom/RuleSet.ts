import { Tile, TileColors } from "./Tile";

export interface RuleSet {
    checkColors(tile: Tile, colors: TileColors): boolean;
}

export class MatchEdgeColorsRuleSet implements RuleSet {
    checkColors(tile: Tile, colors: TileColors): boolean {
        const edges = tile.edges;
        if (colors.length != edges.length) return false;
        for (let i = 0; i < colors.length; i++) {
            const edge = edges[i];
            if (!edge) continue;
            if (edge.tileA && edge.tileA.colors[edge.edgeIdxA] != colors[i])
                return false;
            if (edge.tileB && edge.tileB.colors[edge.edgeIdxB] != colors[i])
                return false;
        }
        return true;
    }
}
