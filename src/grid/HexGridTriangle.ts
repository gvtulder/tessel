import { CoordEdge, Triangle } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class HexGridTriangle extends Triangle {
    protected calc() {
        const height = Math.sqrt(3) / 2;
        this.rotationShape = 0;
        this.rotationAngles = [0, 60, 120, 180, 240, 300];

        // indices for rotation
        const shiftRotationCoords = (start : number) : CoordEdge[] => {
            // triangle coordinates in clockwise order
            const coords = [[0, 0], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
            const edges : CoordEdge[] = [];
            for (let r=0; r<6; r++) {
                edges.push({
                    from: [
                        coords[(r + start + 5) % 6][0] - coords[start][0],
                        coords[(r + start + 5) % 6][1] - coords[start][1]
                    ],
                    to: [
                        coords[(r + start) % 6][0] - coords[start][0],
                        coords[(r + start) % 6][1] - coords[start][1]
                    ],
                });
            }
            return edges;
        };

        // equilateral triangle in a hexagonal grid
        if (wrapModulo(this.x, 2) == wrapModulo(this.y, 2)) {
            // triangle pointing down
            this.points = [[0, 0], [1, 0], [0.5, height]];
            this.polyPoints = [[0, 0], [1 + O, 0], [0.5, height + O], [0.5, height], [0, 0]];
            this.neighborOffsets = [[0, -1], [1, 0], [-1, 0]];
            this.rotationOffsets = shiftRotationCoords(0);
            this.shape = 0;
            this.xAtOrigin = 0;
            this.yAtOrigin = 0;
        } else {
            // triangle pointing up
            this.points = [[0.5, 0], [1, height], [0, height]];
            this.polyPoints = [[0.5, 0], [0.5 + O, 0], [1 + O, height], [1 + O, height + O], [0, height + O], [0, height], [0.5, 0]];
            this.neighborOffsets = [[-1, 0], [1, 0], [0, 1]];
            this.rotationOffsets = shiftRotationCoords(1);
            this.shape = 1;
            this.xAtOrigin = 1;
            this.yAtOrigin = 0;
        }

        this.left = this.x * 0.5 * this.width;
        this.top = this.y * this.height;
    }
}
