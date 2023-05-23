import { Tile } from './Tile.js';
import { wrapModulo } from '../utils.js';
import { Grid } from './Grid.js';
import { Triangle } from './Triangle.js';

export type TriangleOffsets = number[][][];

export const newCustomTileType = (triangleOffsets : TriangleOffsets, periodX : number, stepY: [number, number]) => {

return class CustomTile extends Tile {
    triangleOffsets = triangleOffsets;

    constructor(grid : Grid, x : number, y : number) {
        super(grid, x, y);
    }

    get rotationAngles() {
        return [0, 60, 120, 180, 240, 300];
    }

    findTriangles(): Triangle[] {
        const triangles: Triangle[] = [];
        const shapeIdx = wrapModulo(this.x, triangleOffsets.length);
        for (const [offsetX, offsetY] of triangleOffsets[shapeIdx]) {
            const x = Math.floor(this.x / triangleOffsets.length) * periodX + this.y * stepY[0] + offsetX;
            const y = this.y * stepY[1] + offsetY;
            triangles.push(this.grid.getOrAddTriangle(x, y));
        }
        return triangles;

        // TODO
        /*
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
        */
    }
}

};
