import { Coord, CoordEdge, Triangle, TriangleParams } from './Triangle.js';
import { O } from '../settings.js';
import { polarToCartesian, shiftCoordinates, shiftCoordinates2, shiftToAndReturnOrigin, shiftToOrigin, shiftToOrigin2, wrapModulo } from '../utils.js';


const RADIUS = 1;
const alpha = 120;
const beta = 120;
const originalAngle = 30;

const height = Math.cos(((60 - 45) / 180) * Math.PI) * Math.sqrt(2 * RADIUS * RADIUS);
const base = 2 * Math.sin(((60 - 45) / 180) * Math.PI) * Math.sqrt(2 * RADIUS * RADIUS);

const colstepx = Math.cos((originalAngle / 180) * Math.PI) * (base + 2 * height);
const colstepy = Math.sin((originalAngle / 180) * Math.PI) * (base + 2 * height);
const rowstepx = Math.cos(((90 + originalAngle) / 180) * Math.PI) * (base + 2 * height);
const rowstepy = Math.sin(((90 + originalAngle) / 180) * Math.PI) * (base + 2 * height);


export class PentagonGridTriangle extends Triangle {
    protected calc(x : number, y : number) : TriangleParams {
        const p : TriangleParams = {};

        p.tileMinGridPeriodX = 1;
        p.tileMinGridPeriodY = 1;
        p.tileGridPeriodX = 20;
        p.tileGridPeriodY = 2;

        const row = y;
        const col = Math.floor(x / 20);
        const shape = wrapModulo(x, 5);
        const rot = Math.floor(wrapModulo(x, 20) / 5);

        const angle = originalAngle + rot * 90;

        const xa = 0;
        const ya = 0;
        const xb = Math.cos(((angle - alpha) / 180) * Math.PI) * RADIUS;
        const yb = Math.sin(((angle - alpha) / 180) * Math.PI) * RADIUS;
        const xc = xb + Math.cos(((angle - alpha + 90) / 180) * Math.PI) * RADIUS;
        const yc = yb + Math.sin(((angle - alpha + 90) / 180) * Math.PI) * RADIUS;
        const xd = xc + Math.cos(((angle - alpha + 90 + 180 - beta) / 180) * Math.PI) * RADIUS;
        const yd = yc + Math.sin(((angle - alpha + 90 + 180 - beta) / 180) * Math.PI) * RADIUS;
        const xe = xd + Math.cos(((angle - alpha + 90 + 180 - beta + 90) / 180) * Math.PI) * RADIUS;
        const ye = yd + Math.sin(((angle - alpha + 90 + 180 - beta + 90) / 180) * Math.PI) * RADIUS;
        const xcenter = ((xa + xe) / 2 + xc) / 2;
        const ycenter = ((ya + ye) / 2 + yc) / 2;

        let offsetx = 0;
        let offsety = 0;
        if (rot == 1) {
            offsetx = xa - xc;
            offsety = ya - yc;
        } else if (rot == 2) {
            offsetx = xa - xe;
            offsety = ya - ye;
        } else if (rot == 3) {
            offsetx = Math.cos((originalAngle / 180) * Math.PI) * (base + height) - (xa + xe) / 2;
            offsety = Math.sin((originalAngle / 180) * Math.PI) * (base + height) - (ya + ye) / 2;
        }

        offsetx += colstepx * (col + 0.5 * wrapModulo(row, 2) + Math.floor(row / 2)) + rowstepx * (row / 2);
        offsety += colstepy * (col + 0.5 * wrapModulo(row, 2) + Math.floor(row / 2)) + rowstepy * (row / 2);

        let tri : Coord[] = [];
        if (shape == 0) {
            tri = [ [xa, ya], [xcenter, ycenter], [xe, ye] ];
        } else if (shape == 1) {
            tri = [ [xb, yb], [xcenter, ycenter], [xa, ya] ];
        } else if (shape == 2) {
            tri = [ [xc, yc], [xcenter, ycenter], [xb, yb] ];
        } else if (shape == 3) {
            tri = [ [xd, yd], [xcenter, ycenter], [xc, yc] ];
        } else if (shape == 4) {
            tri = [ [xe, ye], [xcenter, ycenter], [xd, yd] ];
        }

        tri = shiftCoordinates(tri, [offsetx, offsety]);
        const [movedTri, origin] = shiftToAndReturnOrigin(tri);
        p.points = movedTri as [Coord, Coord, Coord]
        p.polyPoints = addOverlap(p.shape, [...p.points, p.points[0]]);
        p.left = origin[0];
        p.top = origin[1];
        p.shape = wrapModulo(x, 20);
        p.xAtOrigin = wrapModulo(x, 20);
        p.yAtOrigin = 0;
        p.rotationAngles = [0, 90, 180, 270];
        p.rotationOffsets = [0, 1, 2, 3].map(
            (i) => {
                const toIdx = wrapModulo(p.shape + 5 * i, 20);
                const toOffset = toIdx - p.shape;
                return {
                    from: [toOffset + ((wrapModulo(toIdx, 5) == 0) ? 4 : -1), 0],
                    to: [toOffset, 0],
                };
            }
        );

        // top neighbor
        const topNeighbors = [
            [10, 0],    // 0
            [6, 0],     // 1
            [14, -1],   // 2    -6, 1
            [26, -1],   // 3    6, 1
            [14, 0],    // 4
            [-10, 0],   // 5
            [6, -1],    // 6    -2, -1
            [-6, 0],    // 7
            [6, 0],     // 8
            [-26, 1],   // 9   -6, 1
            [-10, 0],   // 10
            [6, 0],     // 11
            [-6, 1],    // 12
            [-14, 1],   // 13
            [-6, 0],    // 14
            [10, 0],    // 15
            [-14, 1],   // 16
            [-6, 0],    // 17
            [-14, 0],   // 18
            [14, -1],   // 19
        ] as Coord[];
        p.neighborOffsets = [
            // previous in rotation
            [p.shape % 5 == 0 ? 4 : -1, 0],
            // top
            topNeighbors[p.shape],
            // next in rotation
            [p.shape % 5 == 4 ? -4 : 1, 0],
        ];

        return p;
    }

    protected approxGridPositionToTriangleCoord(gridPos : Coord) : Coord {
        // TODO
        return [
            Math.floor(gridPos[0] * 12),
            Math.floor(gridPos[1]),
        ];
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
