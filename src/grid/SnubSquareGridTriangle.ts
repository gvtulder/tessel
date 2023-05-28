import { Coord, CoordEdge, Triangle, TriangleParams } from './Triangle.js';
import { O } from '../settings.js';
import { polarToCartesian, shiftToAndReturnOrigin, shiftToOrigin, shiftToOrigin2, wrapModulo } from '../utils.js';

export class SnubSquareGridTriangle extends Triangle {
    protected calc(x : number, y : number) : TriangleParams {
        const p : TriangleParams = {};

        p.tileMinGridPeriodX = 1;
        p.tileMinGridPeriodY = 1;
        p.tileGridPeriodX = 12;
        p.tileGridPeriodY = 1;

        // snub square tiles
        const r = 1;
        const angle = 0 ; // 135;

        // polar coordinates converted to cartesian
        const diag = Math.sqrt(2 * r);
        let tri : [Coord, Coord, Coord][] = [
            // 0 - equilateral triangle pointing up
            [ [0, 0], [r, 60], [r, 0] ],
            // 1 - upper square segment bottom-right
            [ [0, 0], [diag / 2, 105], [r, 60] ],
            // 2 - upper square segment top-right
            [ [diag / 2, 105], [diag, 105], [r, 60] ],
            // 3 - upper square segment top-left
            [ [r, 150], [diag, 105], [diag / 2, 105], ],
            // 4 - upper square segment bottom-left
            [ [0, 0], [r, 150], [diag / 2, 105] ],
            // 5 - equilateral triangle pointing right
            [ [0, 0], [r, 210], [r, 150] ],
            // 6 - equilateral triangle pointing left
            [ [r, 210], [Math.sqrt(3) * r, 180], [r, 150] ],
            // 7 - lower square segment top-left
            [ [0, 0], [diag / 2, 255], [r, 210] ],
            // 8 - lower square segment bottom-left
            [ [diag / 2, 255], [diag, 255], [r, 210] ],
            // 9 - lower square segment bottom-right
            [ [diag / 2, 255], [r, 300], [diag, 255] ],
            // 10 - lower square segment top-right
            [ [0, 0], [r, 300], [diag / 2, 255] ],
            // 11 - equilateral triangle pointing down
            [ [0, 0], [r, 0], [r, 300] ],
        ].map((t) => t.map((c) =>
            polarToCartesian([c[0], (c[1] + angle) * Math.PI / 180])
        )) as [Coord, Coord, Coord][];
        tri = shiftToOrigin2(tri) as [Coord, Coord, Coord][];

        const neighborOffsets = [
            // 0 - equilateral triangle pointing up
            [ [11, 0], [20, 0], [1, 0] ],
            // 1 - upper square segment bottom-right
            [ [-1, 0], [1, 0], [3, 0] ],
            // 2 - upper square segment top-right
            [ [-1, 0], [16, 0], [1, 0] ],
            // 3 - upper square segment top-left
            [ [-1, 0], [8, -1], [1, 0] ],
            // 4 - upper square segment bottom-left
            [ [-3, 0], [-1, 0], [1, 0] ],
            // 5 - equilateral triangle pointing right
            [ [-1, 0], [1, 0], [2, 0] ],
            // 6 - equilateral triangle pointing left
            [ [-1, 0], [3, -1], [-16, 0]],
            // 7 - lower square segment top-left
            [ [-2, 0], [1, 0], [3, 0] ],
            // 8 - lower square segment bottom-left
            [ [-1, 0], [-20, 0], [1, 0] ],
            // 9 - lower square segment bottom-right
            [ [-1, 0], [-3, 1], [1, 0] ],
            // 10 - lower square segment top-right
            [ [-1, 0], [1, 0], [-3, 0] ],
            // 11 - equilateral triangle pointing down
            [ [-1, 0], [-8, 1], [-11, 0] ],
        ] as Coord[][];

        // shift in the x and y direction depends on the angle
        // (the grid may be rotated)
        const stepX_A = polarToCartesian([r, 60 / 180 * Math.PI]);
        const stepX_B = polarToCartesian([r, 210 / 180 * Math.PI]);
        const stepX = [stepX_A[0] - stepX_B[0], stepX_A[1] - stepX_B[1]];
        const stepY_A = polarToCartesian([r, 300 / 180 * Math.PI]);
        const stepY_B = polarToCartesian([r, 150 / 180 * Math.PI]);
        const stepY = [stepY_A[0] - stepY_B[0], stepY_A[1] - stepY_B[1]];

        p.shape = wrapModulo(x, 12);
        const [movedTri, origin] = shiftToAndReturnOrigin(tri[p.shape]);
        p.points = movedTri as [Coord, Coord, Coord]
        p.polyPoints = [...p.points, p.points[0]];
        p.neighborOffsets = neighborOffsets[p.shape];

        p.left = Math.floor(x / 12) * stepX[0] + y * stepY[0] + origin[0];
        p.top = Math.floor(x / 12) * stepX[1] + y * stepY[1] + origin[1];
        p.xAtOrigin = wrapModulo(x, 12);
        p.yAtOrigin = 0;

        // squares can do most of these
        // large triangles only do 90-degree rotations
        p.rotationAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

        const rotSequences = [
            // large equilateral triangles do 90-degree rotations
            [ [11, 0], null, null, [5, 6],  null, null,
              [0, 11], null, null, [6, 5], null, null ],
            // triangles in square do 90-degrees and some 30-degrees
            [ [8, 9], [4, 1], null, [9, 10], [1, 2], null,
              [10, 7], [2, 3], null, [7, 8], [3, 4], null ],
        ];
        // sequence for this shape
        const rotSequence = rotSequences.find((seq) =>
            seq && seq.find((edge) => edge && edge[1] == p.shape)
        );
        // find the first edge in the sequence
        const rotIdx = rotSequence.findIndex((edge) =>
            edge && edge[1] == p.shape
        );
        // start with the right shape
        const orderedSequence = [
            ...rotSequence.slice(rotIdx), ...rotSequence.slice(0, rotIdx)];
        p.rotationOffsets = orderedSequence.map(
            (edge) => (edge == null) ? null :
                {
                    from: [(edge[0] - p.shape), 0],
                    to: [(edge[1] - p.shape), 0]
                }
        );

        return p;
    }

    protected approxGridPositionToTriangleCoord(gridPos : Coord) : Coord {
        return [
            Math.floor(gridPos[0] * 12),
            Math.floor(gridPos[1]),
        ];
    }
}
