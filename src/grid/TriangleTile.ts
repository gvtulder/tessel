import { wrapModulo } from 'src/utils.js';
import { EquilateralGridTriangle } from './EquilateralGridTriangle.js';
import { OrientedColors, Tile } from './Tile.js';
import { TileColors } from './Grid.js';

export class TriangleTile extends Tile {
    get rotationAngles() {
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

    getShapeAfterRotation(shape : string, rotation : number) : string {
        // odd rotations change the shape from up to down
        if (rotation % 2 == 1) {
            return (shape == 'down') ? 'up' : 'down';
        }
        return shape;
    }

    get shape() : string {
        // shape of this triangle on the grid
        return wrapModulo(this.y, 2) == 0 ? 'down' : 'up';
    }

    getOrientedColors(rotation : number) : OrientedColors {
        return {
            shape: this.shape,
            rotation: rotation,
            colors: this.colors,
        };
    }

    computeFromOrientedColors(orientedColors : OrientedColors) : TileColors {
        // down : ccw, 0 on top
        // up   : cw, 0 on left

        let map : number[] = [];
        if (this.shape == 'up') {
            if (orientedColors.shape == 'up') {
                // same order
                if (orientedColors.rotation == 0)      { map = [0, 1, 2]; }
                else if (orientedColors.rotation == 1) { map = null; }
                else if (orientedColors.rotation == 2) { map = [2, 0, 1]; }
                else if (orientedColors.rotation == 3) { map = null; }
                else if (orientedColors.rotation == 4) { map = [1, 2, 0]; }
                else if (orientedColors.rotation == 5) { map = null; }
            } else if (orientedColors.shape == 'down') {
                // reverse order
                if (orientedColors.rotation == 0)      { map = null; }
                else if (orientedColors.rotation == 1) { map = [1, 0, 2]; }
                else if (orientedColors.rotation == 2) { map = null; }
                else if (orientedColors.rotation == 3) { map = [2, 1, 0]; }
                else if (orientedColors.rotation == 4) { map = null}
                else if (orientedColors.rotation == 5) { map = [0, 2, 1]; }
            }
        } else if (this.shape == 'down') {
            if (orientedColors.shape == 'up') {
                // reverse order
                if (orientedColors.rotation == 0)      { map = null; }
                else if (orientedColors.rotation == 1) { map = [0, 2, 1]; }
                else if (orientedColors.rotation == 2) { map = null; }
                else if (orientedColors.rotation == 3) { map = [2, 1, 0]; }
                else if (orientedColors.rotation == 4) { map = null}
                else if (orientedColors.rotation == 5) { map = [1, 0, 2]; }
            } else if (orientedColors.shape == 'down') {
                // same order
                if (orientedColors.rotation == 0)      { map = [0, 1, 2]; }
                else if (orientedColors.rotation == 1) { map = null; }
                else if (orientedColors.rotation == 2) { map = [1, 2, 0]; }
                else if (orientedColors.rotation == 3) { map = null; }
                else if (orientedColors.rotation == 4) { map = [2, 0, 1]; }
                else if (orientedColors.rotation == 5) { map = null; }
            }
        }
        if (map === null) return null;
        return map.map((i) => orientedColors.colors[i]);
    }
}
