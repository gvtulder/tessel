import { Tile, TileColors, TileSegment } from "../Tile";
import { RuleSet } from "./RuleSet";

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
