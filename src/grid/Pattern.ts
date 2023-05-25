import { wrapModulo } from "src/utils.js";
import { newCustomTileType } from "./CustomTile.js";
import { Grid } from "./Grid.js";
import { Tile } from "./Tile.js";
import { Coord, CoordId, Triangle, TriangleType } from "./Triangle.js";

const COLORS = ['red', 'green', 'blue', 'black', 'orange', 'purple', 'grey', 'orange', 'green'];

// the tiles in a pattern
export type TileShapes = Coord[][];


export class Pattern {
    triangleType : TriangleType;
    shapes : TileShapes;
    periodX : number;
    stepY : [number, number];

    private grid : Grid;

    constructor(triangleType : TriangleType, shapes : TileShapes) {
        this.grid = new Grid(triangleType);
        this.shapes = shapes;

        this.computePeriods();
    }

    constructTile(grid : Grid, x : number, y : number) : Tile {
        const patterns = this.shapes;
        const shapeIdx = wrapModulo(x, patterns.length);

        const triangles: Triangle[] = [];
        for (const [offsetX, offsetY] of patterns[shapeIdx]) {
            const triangleX = Math.floor(x / patterns.length) * this.periodX + y * this.stepY[0] + offsetX;
            const triangleY = y * this.stepY[1] + offsetY;
            triangles.push(grid.getOrAddTriangle(triangleX, triangleY));
        }
        return new Tile(grid, x, y, triangles);
    }

    mapTriangleCoordToTileCoord(triangle : Coord) : Coord {
        const patterns = this.shapes;

        // triangleY = tileY * stepY[1] + offsetY
        // offsetY = triangleY - tileY * stepY[1]
        // tileY = (triangleY - offsetY) / stepY[1]
        //
        // triangleX = Math.floor(tileX / triangleOffsets.length) * periodX + tileY * stepY[0] + offsetX
        // tileX = Math.floor((triangleX - tileY * stepY[0] - offsetX) / periodX)
        // offsetX = triangleX - Math.floor(tileX / triangleOffsets.length) * periodX - tileY * stepY[0]

        for (let i=0; i<patterns.length; i++) {
            for (const offset of patterns[i]) {
                const tileY = Math.floor((triangle[1] - offset[1]) / this.stepY[1]);
                const offsetY = triangle[1] - tileY * this.stepY[1];

                const tileX = Math.floor((triangle[0] - tileY * this.stepY[0] - offset[0]) / this.periodX);
                const offsetX = triangle[0] - Math.floor(tileX / patterns.length) * this.periodX - tileY * this.stepY[0]
                if (offset[0] == offsetX && offset[1] == offsetY) {
                    return [tileX, tileY];
                }
            }
        }
        return null;
    }

    private computePeriods() {
        const minX = Math.min(...this.shapes.map(
            (triangle) => Math.min(...triangle.map((o) => o[0]))));
        const minY = Math.min(...this.shapes.map(
            (triangle) => Math.min(...triangle.map((o) => o[1]))));
        const maxX = Math.max(...this.shapes.map(
            (triangle) => Math.max(...triangle.map((o) => o[0]))));
        const maxY = Math.max(...this.shapes.map(
            (triangle) => Math.max(...triangle.map((o) => o[1]))));
        const maxPeriodX = maxX - minX + 1;
        const maxPeriodY = maxY - minY + 1;

        const checkPeriodFits = (periodX : number, stepX : number, stepY : number) : number => {
            // returns the number of touching triangles
            const trianglesInShape : Triangle[] = [];
            const seen = new Set<string>();
            for (const shape of this.shapes) {
                for (const offset of shape) {
                    const coordId = CoordId(offset);
                    // this triangle
                    const triangle = this.grid.getOrAddTriangle(offset[0], offset[1]);
                    trianglesInShape.push(triangle);
                    if (seen.has(coordId)) return -1;
                    seen.add(coordId);
                    const expectedShape = triangle.shape;

                    // check repetitions in both directions
                    for (let i=-periodX; i<2 * periodX; i++) {
                        for (let j=-2; j<3; j++) {
                            if (i==0 && j==0) continue;
                            const x = i * periodX + j * stepX + offset[0];
                            const y = j * stepY + offset[1];
                            const s = CoordId(x, y);
                            // console.log('triangle', x, y);
                            if (seen.has(s)) return -1;
                            const shape = this.grid.getOrAddTriangle(x, y).shape;
                            if (shape != expectedShape) return -1;
                            seen.add(s);
                        }
                    }
                }
            }
            // count number of touching triangles
            let touching = 0;
            for (const t of trianglesInShape) {
                for (const n of t.getNeighbors()) {
                    if (seen.has(n.coordId)) touching++;
                }
            }
            return touching;
        }

        let bestTouching = 0;
        let bestPeriodX = -1;
        let bestStepX = -1;
        let bestStepY = -1;

        console.log(maxPeriodX, maxPeriodY);
        const range = Math.max(maxPeriodX, maxPeriodY);
        let periodX = 1;
        while (periodX <= range * 2) {
            let stepX = -range;
            while (stepX <= range) {
                let stepY = -range;
                while (stepY <= range) {
                    const touching = checkPeriodFits(periodX, stepX, stepY);
                    if (touching != -1) {
                        // console.log('fits', [periodX, stepX, stepY], touching);
                        if (bestPeriodX == -1 || touching > bestTouching ||
                            (touching == bestTouching && Math.abs(stepX) < Math.abs(bestStepX)) ||
                            (touching == bestTouching && Math.abs(stepX) == Math.abs(bestStepX) &&  Math.abs(stepY) == Math.abs(bestStepY))) {
                            bestPeriodX = periodX;
                            bestStepX = stepX;
                            bestStepY = stepY;
                            bestTouching = touching;
                        }
                    }
                    stepY++;
                }
                stepX++;
            }
            periodX++;
        }

        this.periodX = bestPeriodX;
        this.stepY = [bestStepX, bestStepY];
        console.log('bestPeriod', this.periodX, this.stepY, [minX, maxX], [minY, maxY]);

        /*
        bestPeriodX = 6;
        bestStepX = 3;
        bestStepY = 1;

        this.periodX = bestPeriodX;
        this.stepY = [bestStepX, bestStepY];
        console.log('bestPeriod', this.periodX, this.stepY, [minX, maxX], [minY, maxY]);
        */
    }
}
