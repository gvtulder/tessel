import { Coord, CoordEdge, Triangle, TriangleParams } from './Triangle.js';
import { O } from '../settings.js';
import { wrapModulo } from '../utils.js';

export class HexGridTriangle extends Triangle {
    protected calc(x : number, y : number) : TriangleParams {
        const p : TriangleParams = {};

        p.tileMinGridPeriodX = 1;
        p.tileMinGridPeriodY = 1;
        p.tileGridPeriodX = 2;
        p.tileGridPeriodY = 2;

        const width = 1;
        const height = Math.sqrt(3) / 2;
        p.rotationAngles = [0, 60, 120, 180, 240, 300];

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
        if (wrapModulo(x, 2) == wrapModulo(y, 2)) {
            // triangle pointing down
            p.points = [[0, 0], [1, 0], [0.5, height]];
            p.polyPoints = [[0, 0], [1 + O, 0], [0.5, height + O], [0.5, height], [0, 0]];
            p.neighborOffsets = [[0, -1], [1, 0], [-1, 0]];
            p.rotationOffsets = shiftRotationCoords(0);
            p.shape = 0;
            p.xAtOrigin = 0;
            p.yAtOrigin = 0;
        } else {
            // triangle pointing up
            p.points = [[0.5, 0], [1, height], [0, height]];
            p.polyPoints = [[0.5, 0], [0.5 + O, 0], [1 + O, height], [1 + O, height + O], [0, height + O], [0, height], [0.5, 0]];
            p.neighborOffsets = [[-1, 0], [1, 0], [0, 1]];
            p.rotationOffsets = shiftRotationCoords(1);
            p.shape = 1;
            p.xAtOrigin = 1;
            p.yAtOrigin = 0;
        }

        p.left = x * 0.5 * width;
        p.top = y * height;

        return p;
    }

    protected approxGridPositionToTriangleCoord(gridPos : Coord) : Coord {
        const height = Math.sqrt(3) / 2;
        return [
            Math.floor(gridPos[0] / (0.5 * height)),
            Math.floor(gridPos[1] / height),
        ];
    }
}
