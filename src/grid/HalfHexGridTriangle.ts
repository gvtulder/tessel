import { Coord, CoordEdge, Triangle, TriangleParams } from './Triangle.js';
import { O } from '../settings.js';
import { polarToCartesian, shiftToAndReturnOrigin, wrapModulo } from '../utils.js';


const RADIUS = 1;
const BASE = 2 * RADIUS * Math.sin(30 / 180 * Math.PI);
const HEIGHT = RADIUS * Math.cos(30 / 180 * Math.PI);

export class HalfHexGridTriangle extends Triangle {
    protected calc(x : number, y : number) : TriangleParams {
        const p : TriangleParams = {};

        // 12 triangles rotated around a center

        p.shape = wrapModulo(x, 12);
        p.xAtOrigin = wrapModulo(x, 12);
        p.yAtOrigin = 0;

        // TODO
        p.tileMinGridPeriodX = 1;
        p.tileMinGridPeriodY = 1;
        p.tileGridPeriodX = 12;
        p.tileGridPeriodY = 2;

        // polar coordinates converted to cartesian
        const radius = RADIUS;
        const base = BASE;
        const height = HEIGHT;
        const angle = 30 * p.shape;
        let tri = [
            [0, 0],
            [p.shape % 2 == 0 ? radius : height, 0],
            [p.shape % 2 == 1 ? radius : height, 30],
        ] as [Coord, Coord, Coord];
        tri = tri.map(
            (c) => polarToCartesian([c[0], (c[1] + angle) / 180 * Math.PI])
        ) as [Coord, Coord, Coord];
        const [movedTri, origin] = shiftToAndReturnOrigin(tri);
        p.points = movedTri as [Coord, Coord, Coord]
        p.polyPoints = [...p.points, p.points[0]];
        p.rotationAngles = [0, 60, 120, 180, 240, 300];
        p.rotationOffsets = [0, 2, 4, 6, 8, 10].map(
            (i) => ({
                from: [wrapModulo(p.shape + i - 1, 12) - p.shape, 0],
                to: [wrapModulo(p.shape + i, 12) - p.shape, 0]
            })
        );

        p.left = Math.floor(x / 12) * 1.5 * base + origin[0];
        p.top = y * 2 * height + Math.floor(x / 12) * height + origin[1];

        // top neighbor
        const topNeighbors = [
            [19, 0],    // 0
            [17, 0],    // 1
            [7, 1],     // 2
            [5, 1],     // 3
            [-5, 1],    // 4
            [-7, 1],    // 5
            [-17, 0],   // 6
            [-19, 0],   // 7
            [-5, -1],   // 8
            [-7, -1],   // 9
            [7, -1],    // 10
            [5, -1],    // 11
        ] as Coord[];
        p.neighborOffsets = [
            // previous in rotation
            [p.shape == 0 ? 11 : -1, 0],
            // top
            topNeighbors[p.shape],
            // next in rotation
            [p.shape == 11 ? -11 : 1, 0],
        ];

        return p;
    }

    protected approxGridPositionToTriangleCoord(gridPos : Coord) : Coord {
        const estimatedCol = Math.floor(gridPos[0] / (1.5 * BASE) + 0.5);
        const estimatedRow = Math.floor((gridPos[1] - estimatedCol * HEIGHT) / (2 * HEIGHT) + 0.5);
        return [estimatedCol * 12, estimatedRow];
    }
}
