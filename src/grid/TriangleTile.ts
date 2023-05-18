import { EquilateralGridTriangle } from './EquilateralGridTriangle.js';
import { Tile } from './Tile.js';

export class TriangleTile extends Tile {
    findTriangles(): EquilateralGridTriangle[] {
        const triangles: EquilateralGridTriangle[] = [];

        const x = this.x;
        const y = this.y * 3;

        // top
        triangles.push(this.grid.getOrAddTriangle(x, y));
        // counter-clockwise
        triangles.push(this.grid.getOrAddTriangle(x, y + 1));
        triangles.push(this.grid.getOrAddTriangle(x, y + 2));

        return triangles;
    }
}
