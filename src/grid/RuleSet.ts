import { Tile, TileColors, TileSegment } from "./Tile";

/**
 * A RuleSet can check if the new colors would fit on the given tile.
 */
export interface RuleSet {
    /**
     * A user-friendly name for this ruleset.
     */
    name: string;

    /**
     * Checks if the colors would fit on this tile.
     * @param tile a tile on the grid
     * @param colors the new color sequence
     * @param offset the offset of the colors in the tile
     */
    checkColors(tile: Tile, colors: TileColors, offset?: number): boolean;

    /**
     * Returns the color constraints for the tile segment,
     * listing the tile segments that should have the same color
     * and those that should have a different color.
     */
    computeColorConstraints(tileSegment: TileSegment): {
        same: TileSegment[];
        different: TileSegment[];
    };
}

/**
 * RuleSet that requires segments connected to the same outside edge
 * of a tile share the same color.
 */
export class MatchEdgeColorsRuleSet implements RuleSet {
    name = "Touching tiles must have the same color";

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

    computeColorConstraints(tileSegment: TileSegment): {
        same: TileSegment[];
        different: TileSegment[];
    } {
        return { same: tileSegment.getNeighbors(), different: [] };
    }
}

/**
 * RuleSet that requires segments connected to the same outside edge
 * of a tile have different colors.
 */
export class DifferentEdgeColorsRuleSet implements RuleSet {
    name = "Touching tiles must have different colors";

    checkColors(tile: Tile, colors: TileColors, offset?: number): boolean {
        const edges = tile.edges;
        const n = edges.length;
        if (colors.length != n) return false;
        if (offset === undefined) offset = 0;
        for (let i = 0; i < n; i++) {
            const edge = edges[(i + n - offset) % n];
            if (!edge) continue;
            if (edge.tileA && edge.tileA.colors![edge.edgeIdxA!] == colors[i])
                return false;
            if (edge.tileB && edge.tileB.colors![edge.edgeIdxB!] == colors[i])
                return false;
        }
        return true;
    }

    computeColorConstraints(tileSegment: TileSegment): {
        same: TileSegment[];
        different: TileSegment[];
    } {
        return { same: [], different: tileSegment.getNeighbors() };
    }
}
