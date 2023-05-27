import { Coord, CoordEdge, Triangle, TriangleParams } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class SquareGridTriangle extends Triangle {
    protected calc(x : number, y : number) : TriangleParams {
        const p : TriangleParams = {};

        // triangle in a square grid
        p.left = x;
        p.top = Math.floor(y / 4);
        p.shape = wrapModulo(y, 4);
        p.rotationAngles = [0, 90, 180, 270];
        p.xAtOrigin = 0;
        p.yAtOrigin = wrapModulo(y, 4);
        p.tileMinGridPeriodX = 1;
        p.tileMinGridPeriodY = 4;
        p.tileGridPeriodX = 1;
        p.tileGridPeriodY = 4;

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

        switch (p.shape) {
            case 0:
                // top triangle pointing down
                p.points = [[0, 0], [1, 0], [0.5, 0.5]];
                p.polyPoints = [[0, 0], [1 + O, 0], [0.5 + O, 0.5 + O], [0.5 - O, 0.5 + O], [0, O], [0, 0]];
                p.neighborOffsets = [[0, -1], [0, 2], [0, 1]];
                p.rotationOffsets = shiftRotationCoords(0);
                break;
            case 1:
                // left triangle pointing right
                p.points = [[0, 0], [0.5, 0.5], [0, 1]];
                p.polyPoints = [[0, 0], [0.5 + O, 0.5 + O], [0, 1 + O], [0, 0]];
                p.neighborOffsets = [[-1, 1], [0, -1], [0, 2]];
                p.rotationOffsets = shiftRotationCoords(3);
                break;
            case 2:
                // right triangle pointing left
                p.left += 0.5;
                p.points = [[0, 0.5], [0.5, 0], [0.5, 1]];
                p.polyPoints = [[0, 0.5], [0.5, 0], [0.5 + O, 0], [0.5 + O, 1 + O], [0.5, 1 + O], [0, 0.5 + O], [0, 0.5]];
                p.neighborOffsets = [[0, -2], [1, -1], [0, 1]];
                p.rotationOffsets = shiftRotationCoords(1);
                break;
            case 3:
                // bottom triangle pointing up
                p.top += 0.5;
                p.points = [[0, 0.5], [0.5, 0], [1, 0.5]];
                p.polyPoints = [[0, 0.5], [0.5, 0], [1, 0.5], [1 + O, 0.5 + O], [0, 0.5 + O], [0, 0.5]];
                p.neighborOffsets = [[0, -2], [0, -1], [0, 1]];
                p.rotationOffsets = shiftRotationCoords(2);
                break;
            default:
                console.log('invalid side!');
        }

        return p;
    }

    protected approxGridPositionToTriangleCoord(gridPos : Coord) : Coord {
        return [
            Math.floor(gridPos[0]),
            Math.floor(gridPos[1] * 4),
        ];
    }
}
