import { SquareGridTriangle } from './SquareGridTriangle.js';
import { Tile } from './Tile.js';

export class SquareTile extends Tile {
    findTriangles(): SquareGridTriangle[] {
        const triangles: SquareGridTriangle[] = [];

        // top
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4));
        // left
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4 + 1));
        // right
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4 + 2));
        // bottom
        triangles.push(this.grid.getOrAddTriangle(this.x, this.y * 4 + 3));

        return triangles;
    }
}
