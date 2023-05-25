import { TileColors } from "./Grid.js";
import { HexTile } from "./old.HexTile.js";

export class CubeTile extends HexTile {
    get rotationAngles() {
        return [0, 120, 240];
    }

    protected mapColorsToTriangles(colors : TileColors) : TileColors {
        if (typeof colors === 'string') {
            return this.triangles.map(() => colors as string);
        }
        return colors ? [
            colors[0], colors[0],
            colors[1], colors[1],
            colors[2], colors[2],
        ] : colors;
    }
    protected mapColorsFromTriangles(colors : TileColors) : TileColors {
        return [ colors[0], colors[2], colors[4] ];
    }
}