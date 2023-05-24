import { CoordEdge, Triangle } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class EquilateralGridTriangle extends Triangle {
    calc() {
        // triangle in a grid of equilateral triangles
        const height = Math.sqrt(3) / 2;
        const h = height / 3;
        this.left = this.x + Math.floor(this.y / 6) * 0.5;
        this.top = height * Math.floor(this.y / 6);
        this.shape = wrapModulo(this.y, 6);
        this.rotationShape = 0;
        this.rotationAngles = [0, 60, 120, 180, 240, 300];

        // indices for rotation
        const shiftRotationCoords = (start : number) : CoordEdge[] => {
            // triangle coordinates in clockwise order
            // start is the number of a left-side triangle (at even indices)
            const coords = [[-1, 4], [0, 1], [0, 2], [0, 3], [0,5], [0, 6], [0, 7],
                            [-1, 10], [-1, 9], [-1, 8], [-1, 6], [-1, 5]];
            const edges : CoordEdge[] = [];
            for (let r=0; r<6; r++) {
                edges.push({
                    from: [
                        coords[((r + start) * 2) % 12][0] - coords[start * 2 + 1][0],
                        coords[((r + start) * 2) % 12][1] - coords[start * 2 + 1][1]
                    ],
                    to: [
                        coords[((r + start) * 2 + 1) % 12][0] - coords[start * 2 + 1][0],
                        coords[((r + start) * 2 + 1) % 12][1] - coords[start * 2 + 1][1]
                    ],
                });
            }
            return edges;
        };

        switch (this.shape) {
            case 0:
                // top triangle pointing down
                this.points = [[0, 0], [1, 0], [0.5, h]];
                this.polyPoints = [[0, 0], [1 + O, 0], [0.5 + O, h + O], [0.5 - O, h + O], [0, 0]];
                this.neighborOffsets = [[0, -1], [0, 2], [0, 1]];
                this.rotationOffsets = shiftRotationCoords(2);
                // this.rotationOffsets = [[0, 0], [-1, 4], [0, -2]]
                break;
            case 1:
                // left triangle pointing up-right
                this.points = [[0, 0], [0.5, h], [0.5, height]];
                this.polyPoints = [[0, 0], [0.5, h], [0.5 + O, h], [0.5 + O, height + O], [0.5, height], [0, 0]];
                this.neighborOffsets = [[-1, 3], [0, -1], [0, 1]];
                this.rotationOffsets = shiftRotationCoords(0);
                // this.rotationOffsets = [[0, 0], [0, -1], [0, 1]];
                break;
            case 2:
                // right triangle pointing up-left
                this.left += 0.5;
                this.points = [[0, h], [0.5, 0], [0, height]];
                this.polyPoints = [[0, h], [0.5, 0], [0.5 + O, 0], [0, height], [0, h]];
                this.neighborOffsets = [[0, -2], [0, 1], [0, -1]];
                this.rotationOffsets = shiftRotationCoords(4);
                // this.rotationOffsets = [[0, 0], [0, -1], [0, -2]];
                break;
            case 3:
                // left triangle pointing bottom-right
                this.left += 0.5;
                this.points = [[0, height], [0.5, 0], [0.5, 2 * h]];
                this.polyPoints = [[0, height], [0.5, 0], [0.5 + O, 0], [0.5 + O, 2 * h + O], [0, height], [0, height]];
                this.neighborOffsets = [[0, -1], [0, 1], [0, 2]];
                this.rotationOffsets = shiftRotationCoords(1);
                // this.rotationOffsets = [[0, 0], [0, 1], [0, 2]];
                break;
            case 4:
                // right triangle pointing bottom-left
                this.left += 1;
                this.points = [[0, 0], [0.5, height], [0, 2 * h]];
                this.polyPoints = [[0, 0], [O, 0], [0.5 + O, height + O], [0, 2 * h + O], [0, 0]];
                this.neighborOffsets = [[0, -1], [1, -3], [0, 1]];
                this.rotationOffsets = shiftRotationCoords(3);
                // this.rotationOffsets = [[0, 0], [0, 1], [0, 2]];
                break;
            case 5:
                // bottom triangle pointing up
                this.left += 0.5;
                this.top += 2 * h;
                this.points = [[0, h], [0.5, 0], [1, h]];
                this.polyPoints = [[0, h], [0.5, 0], [1, h], [1 + O, h + O], [O, h + O], [0, h]];
                this.neighborOffsets = [[0, -2], [0, -1], [0, 1]];
                this.rotationOffsets = shiftRotationCoords(5);
                // this.rotationOffsets = [[0, 0], [0, -2], [0, -1]];
                break;
            default:
                console.log('invalid side!');
        }
    }
}
