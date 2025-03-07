import { Tile, TileColors } from "./Tile";

/**
 * A RuleSet can check if the new colors would fit on the given tile.
 */
export interface RuleSet {
    /**
     * Checks if the colors would fit on this tile.
     * @param tile a tile on the grid
     * @param colors the new color sequence
     * @param offset the offset of the colors in the tile
     */
    checkColors(tile: Tile, colors: TileColors, offset?: number): boolean;
}

/**
 * RuleSet that requires segments connected to the same outside edge
 * of a tile share the same color.
 */
export class MatchEdgeColorsRuleSet implements RuleSet {
    checkColors(tile: Tile, colors: TileColors, offset?: number): boolean {
        const edges = tile.edges;
        const n = edges.length;
        if (colors.length != n) return false;
        if (offset === undefined) offset = 0;
        for (let i = 0; i < n; i++) {
            const edge = edges[(i + n - offset) % n];
            if (!edge) continue;
            if (edge.tileA && edge.tileA.colors![edge.edgeIdxA!] != colors[i])
                return false;
            if (edge.tileB && edge.tileB.colors![edge.edgeIdxB!] != colors[i])
                return false;
        }
        return true;
    }
}
