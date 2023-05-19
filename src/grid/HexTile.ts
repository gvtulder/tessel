import { HexGridTriangle } from './HexGridTriangle.js';
import { Tile } from './Tile.js';
import { wrapModulo } from '../utils.js';

export class HexTile extends Tile {
    triangleTile = HexGridTriangle;

    findTriangles(): HexGridTriangle[] {
        const triangles: HexGridTriangle[] = [];

        const x = this.x * 6 + (wrapModulo(this.y, 2) == 0 ? 0 : 3);
        const y = this.y;

        // top
        triangles.push(this.grid.getOrAddTriangle(x, y));
        // clockwise
        triangles.push(this.grid.getOrAddTriangle(x + 1, y));
        triangles.push(this.grid.getOrAddTriangle(x + 1, y + 1));
        triangles.push(this.grid.getOrAddTriangle(x, y + 1));
        triangles.push(this.grid.getOrAddTriangle(x - 1, y + 1));
        triangles.push(this.grid.getOrAddTriangle(x - 1, y));

        if (wrapModulo(this.y, 2) == 0) {
            this.neighborOffsets = [[-1, -1], [0, -2], [0, -1], [0, 1], [0, 2], [-1, 1]];
        } else {
            this.neighborOffsets = [[1, -1], [0, -2], [0, -1], [0, 1], [0, 2], [1, 1]];
        }

        return triangles;
    }
}
