import { Coord, CoordEdge, Triangle, TriangleParams } from './Triangle.js';
import { O } from '../settings.js';
import { polarToCartesian, shiftToAndReturnOrigin, wrapModulo } from '../utils.js';


const RADIUS = 0.8;
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
        p.polyPoints = addOverlap(p.shape, [...p.points, p.points[0]]);
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

function addOverlap(shape : number, points : Coord[]) : Coord[] {
    if (points.length != 4) return points;

    let left : number = points[0][0];
    let top : number = points[0][1];
    for (const point of points) {
        if (left > point[0]) left = point[0];
        if (top > point[1]) top = point[1];
    }

    const OVERLAP = 0.01 * RADIUS;
    const EPSILON = 0.001;
    const newPoints : Coord[] = [];
    for (let i=0; i<points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        if (Math.abs(a[1] - b[1]) < EPSILON && a[0] > b[0]) {
            // horizontal bottom going left
            newPoints.push(a);
            newPoints.push([a[0], a[1] + OVERLAP]);
            newPoints.push([b[0], b[1] + OVERLAP]);
        } else if (a[0] > b[0] && a[1] < b[1]) {
            // right edge going down-left
            newPoints.push(a);
            newPoints.push([a[0] + OVERLAP, a[1]]);
            newPoints.push([b[0] + OVERLAP, b[1]]);
        } else if (a[0] <= b[0] && a[1] < b[1]) {
            // right edge going down-right
            newPoints.push(a);
            newPoints.push([a[0] + OVERLAP, a[1]]);
            newPoints.push([b[0] + OVERLAP, b[1]]);
        } else {
            newPoints.push(a);
        }
    }
    newPoints.push(points[points.length - 1]);

    return newPoints;
}
