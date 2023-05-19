import { wrapModulo } from 'src/utils.js';
import { EquilateralGridTriangle } from './EquilateralGridTriangle.js';
import { Tile } from './Tile.js';

export class TriangleTile extends Tile {
    static triangleType = EquilateralGridTriangle;

    findTriangles(): EquilateralGridTriangle[] {
        const triangles: EquilateralGridTriangle[] = [];

        const x = this.x;
        const y = this.y * 3;

        // top
        triangles.push(this.grid.getOrAddTriangle(x, y));
        // counter-clockwise
        triangles.push(this.grid.getOrAddTriangle(x, y + 1));
        triangles.push(this.grid.getOrAddTriangle(x, y + 2));

        if (wrapModulo(this.y, 2) == 0) {
            this.neighborOffsets = [[-1, 1], [0, 1], [-1, -1]];
        } else {
            this.neighborOffsets = [[1, 1], [0, -1], [1, -1]];
        }

        return triangles;
    }
}
