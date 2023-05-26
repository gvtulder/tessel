import { Coord, CoordEdge, Triangle, TriangleParams } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class EquilateralGridTriangle extends Triangle {
    protected calc(x : number, y : number) : TriangleParams {
        const p : TriangleParams = {};

        // triangle in a grid of equilateral triangles
        const height = Math.sqrt(3) / 2;
        const h = height / 3;
        p.left = x + Math.floor(y / 6) * 0.5;
        p.top = height * Math.floor(y / 6);
        p.shape = wrapModulo(y, 6);
        p.rotationAngles = [0, 60, 120, 180, 240, 300];
        p.xAtOrigin = 0;
        p.yAtOrigin = wrapModulo(y, 6);

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

        switch (p.shape) {
            case 0:
                // top triangle pointing down
                p.points = [[0, 0], [1, 0], [0.5, h]];
                p.polyPoints = [[0, 0], [1 + O, 0], [0.5 + O, h + O], [0.5 - O, h + O], [0, 0]];
                p.neighborOffsets = [[0, -1], [0, 2], [0, 1]];
                p.rotationOffsets = shiftRotationCoords(2);
                break;
            case 1:
                // left triangle pointing up-right
                p.points = [[0, 0], [0.5, h], [0.5, height]];
                p.polyPoints = [[0, 0], [0.5, h], [0.5 + O, h], [0.5 + O, height + O], [0.5, height], [0, 0]];
                p.neighborOffsets = [[-1, 3], [0, -1], [0, 1]];
                p.rotationOffsets = shiftRotationCoords(0);
                break;
            case 2:
                // right triangle pointing up-left
                p.left += 0.5;
                p.points = [[0, h], [0.5, 0], [0, height]];
                p.polyPoints = [[0, h], [0.5, 0], [0.5 + O, 0], [0, height], [0, h]];
                p.neighborOffsets = [[0, -2], [0, 1], [0, -1]];
                p.rotationOffsets = shiftRotationCoords(4);
                break;
            case 3:
                // left triangle pointing bottom-right
                p.left += 0.5;
                p.points = [[0, height], [0.5, 0], [0.5, 2 * h]];
                p.polyPoints = [[0, height], [0.5, 0], [0.5 + O, 0], [0.5 + O, 2 * h + O], [0, height], [0, height]];
                p.neighborOffsets = [[0, -1], [0, 1], [0, 2]];
                p.rotationOffsets = shiftRotationCoords(1);
                break;
            case 4:
                // right triangle pointing bottom-left
                p.left += 1;
                p.points = [[0, 0], [0.5, height], [0, 2 * h]];
                p.polyPoints = [[0, 0], [O, 0], [0.5 + O, height + O], [0, 2 * h + O], [0, 0]];
                p.neighborOffsets = [[0, -1], [1, -3], [0, 1]];
                p.rotationOffsets = shiftRotationCoords(3);
                break;
            case 5:
                // bottom triangle pointing up
                p.left += 0.5;
                p.top += 2 * h;
                p.points = [[0, h], [0.5, 0], [1, h]];
                p.polyPoints = [[0, h], [0.5, 0], [1, h], [1 + O, h + O], [O, h + O], [0, h]];
                p.neighborOffsets = [[0, -2], [0, -1], [0, 1]];
                p.rotationOffsets = shiftRotationCoords(5);
                break;
            default:
                console.log('invalid side!');
        }

        return p;
    }

    protected approxGridPositionToTriangleCoord(gridPos : Coord) : Coord {
        const height = Math.sqrt(3) / 2;
        const approxY = Math.floor((gridPos[1] / height) * 6);
        const approxX = Math.floor(gridPos[0] - Math.floor(approxY / 6) * 0.5);
        return [ approxX, approxY ];
    }
}
