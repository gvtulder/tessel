import { SquareGridTriangle } from './SquareGridTriangle.js';
import { Tile } from './Tile.js';

export class SquareTile extends Tile {
    get rotationAngles() {
        return [0, 90, 180, 270];
    }

    findTriangles(): SquareGridTriangle[] {
        const triangles: SquareGridTriangle[] = [];

        // top
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4));
        // right
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4 + 2));
        // bottom
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4 + 3));
        // left
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4 + 1));

        this.neighborOffsets = [[-1, 0], [0, -1], [1, 0], [0, 1]];

        return triangles;
    }
}
