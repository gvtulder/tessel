import { CoordEdge, Triangle } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class SquareGridTriangle extends Triangle {
    protected calc() {
        // triangle in a square grid
        this.left = this.x;
        this.top = Math.floor(this.y / 4);
        this.shape = wrapModulo(this.y, 4);
        this.rotationAngles = [0, 90, 180, 270];
        this.xAtOrigin = 0;
        this.yAtOrigin = wrapModulo(this.y, 4);

        // indices for rotation
        const shiftRotationCoords = (start : number) : CoordEdge[] => {
            // triangle coordinates in clockwise order
            const coords = [[0, 0], [0, 2], [0, 3], [0, 1]];
            const edges : CoordEdge[] = [];
            for (let r=0; r<4; r++) {
                edges.push({
                    from: [
                        coords[(r + start + 3) % 4][0] - coords[start][0],
                        coords[(r + start + 3) % 4][1] - coords[start][1]
                    ],
                    to: [
                        coords[(r + start) % 4][0] - coords[start][0],
                        coords[(r + start) % 4][1] - coords[start][1]
                    ],
                });
            }
            return edges;
        };

        switch (this.shape) {
            case 0:
                // top triangle pointing down
                this.points = [[0, 0], [1, 0], [0.5, 0.5]];
                this.polyPoints = [[0, 0], [1 + O, 0], [0.5 + O, 0.5 + O], [0.5 - O, 0.5 + O], [0, O], [0, 0]];
                this.neighborOffsets = [[0, -1], [0, 2], [0, 1]];
                this.rotationOffsets = shiftRotationCoords(0);
                break;
            case 1:
                // left triangle pointing right
                this.points = [[0, 0], [0.5, 0.5], [0, 1]];
                this.polyPoints = [[0, 0], [0.5 + O, 0.5 + O], [0, 1 + O], [0, 0]];
                this.neighborOffsets = [[-1, 1], [0, -1], [0, 2]];
                this.rotationOffsets = shiftRotationCoords(3);
                break;
            case 2:
                // right triangle pointing left
                this.left += 0.5;
                this.points = [[0, 0.5], [0.5, 0], [0.5, 1]];
                this.polyPoints = [[0, 0.5], [0.5, 0], [0.5 + O, 0], [0.5 + O, 1 + O], [0.5, 1 + O], [0, 0.5 + O], [0, 0.5]];
                this.neighborOffsets = [[0, -2], [1, -1], [0, 1]];
                this.rotationOffsets = shiftRotationCoords(1);
                break;
            case 3:
                // bottom triangle pointing up
                this.top += 0.5;
                this.points = [[0, 0.5], [0.5, 0], [1, 0.5]];
                this.polyPoints = [[0, 0.5], [0.5, 0], [1, 0.5], [1 + O, 0.5 + O], [0, 0.5 + O], [0, 0.5]];
                this.neighborOffsets = [[0, -2], [0, -1], [0, 1]];
                this.rotationOffsets = shiftRotationCoords(2);
                break;
            default:
                console.log('invalid side!');
        }
    }
}
