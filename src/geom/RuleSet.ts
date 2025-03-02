import { Tile, TileColors } from "./Tile";

export interface RuleSet {
    checkColors(tile: Tile, colors: TileColors, offset?: number): boolean;
}

export class MatchEdgeColorsRuleSet implements RuleSet {
    checkColors(tile: Tile, colors: TileColors, offset?: number): boolean {
        const edges = tile.edges;
        const n = edges.length;
        if (colors.length != n) return false;
        if (offset === undefined) offset = 0;
        for (let i = 0; i < n; i++) {
            const edge = edges[(i + n - offset) % n];
            if (!edge) continue;
            if (edge.tileA && edge.tileA.colors[edge.edgeIdxA] != colors[i])
                return false;
            if (edge.tileB && edge.tileB.colors[edge.edgeIdxB] != colors[i])
                return false;
        }
        return true;
    }
}
