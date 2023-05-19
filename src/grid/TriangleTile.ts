import { wrapModulo } from 'src/utils.js';
import { EquilateralGridTriangle } from './EquilateralGridTriangle.js';
import { Tile } from './Tile.js';

export class TriangleTile extends Tile {
    get rotationAngles() {
        // TODO
        return [0, 60, 120, 180, 240, 300];
    }

    findTriangles(): EquilateralGridTriangle[] {
        const triangles: EquilateralGridTriangle[] = [];

        const x = this.x;
        const y = this.y * 3;

        // top
        triangles.push(this.grid.getOrAddTriangle(x, y));
        // counter-clockwise
        triangles.push(this.grid.getOrAddTriangle(x, y + 1));
        triangles.push(this.grid.getOrAddTriangle(x, y + 2));

        switch (wrapModulo(this.y, 4)) {
            case 0:
                this.neighborOffsets = [[-1, 1], [0, 1], [-1, -1]];
                break;
            case 1:
                this.neighborOffsets = [[0, 1], [0, -1], [1, -1]];
                break;
            case 2:
                this.neighborOffsets = [[-1, 1], [0, 1], [0, -1]];
                break;
            case 3:
                this.neighborOffsets = [[1, 1], [0, -1], [1, -1]];
                break;
        }

        return triangles;
    }
}
