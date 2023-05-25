import { wrapModulo } from "src/utils.js";
import { TriangleOffsets as TriangleOffsetsPattern, newCustomTileType } from "./CustomTile.js";
import { Coord, Grid } from "./Grid.js";
import { Tile } from "./Tile.js";
import { Triangle } from "./Triangle.js";

export class Pattern {
    grid : Grid;
    periodX : number;
    stepY : [number, number];
    triangleOffsetsPattern : TriangleOffsetsPattern;

    triangles : Triangle[];

    constructor(grid : Grid, triangleOffsetsPattern : TriangleOffsetsPattern) {
        this.grid = grid;
        this.triangles = [];
        this.triangleOffsetsPattern = triangleOffsetsPattern;

        this.computePeriods();

        this.build();

        window.pattern = this;
    }

    build() {
        const CustomTileType = newCustomTileType(this.triangleOffsetsPattern, this.periodX, this.stepY);

        const periodX = this.triangleOffsetsPattern.length;
        for (let i=-2 * periodX; i<2 * periodX; i++) {
            for (let j=-2; j<3; j++) {
                const tile = new CustomTileType(this.grid, i, j);
                if ((i >= 0 && i < periodX) && j == 0) {
                    tile.colors = ['red', 'green', 'blue', 'black', 'orange', 'purple', 'grey', 'orange', 'green'];
                } else {
                    tile.colors = null;
                }
                this.grid.addTile(tile);
            }
        }
    }

    getCustomTileType() {
        return newCustomTileType(this.triangleOffsetsPattern, this.periodX, this.stepY);
    }

    mapTriangleCoordToTileCoord(triangle : Coord) : Coord {
        const tiles = this.triangleOffsetsPattern;

        // triangleY = tileY * stepY[1] + offsetY
        // offsetY = triangleY - tileY * stepY[1]
        // tileY = (triangleY - offsetY) / stepY[1]
        //
        // triangleX = Math.floor(tileX / triangleOffsets.length) * periodX + tileY * stepY[0] + offsetX
        // tileX = Math.floor((triangleX - tileY * stepY[0] - offsetX) / periodX)
        // offsetX = triangleX - Math.floor(tileX / triangleOffsets.length) * periodX - tileY * stepY[0]

        for (let i=0; i<tiles.length; i++) {
            for (const offset of tiles[i]) {
                const tileY = Math.floor((triangle[1] - offset[1]) / this.stepY[1]);
                const offsetY = triangle[1] - tileY * this.stepY[1];

                const tileX = Math.floor((triangle[0] - tileY * this.stepY[0] - offset[0]) / this.periodX);
                const offsetX = triangle[0] - Math.floor(tileX / tiles.length) * this.periodX - tileY * this.stepY[0]
                if (offset[0] == offsetX && offset[1] == offsetY) {
                    return [tileX, tileY];
                }
            }
        }
        return null;
    }

    private computePeriods() {
        const minX = Math.min(...this.triangleOffsetsPattern.map(
            (triangle) => Math.min(...triangle.map((o) => o[0]))));
        const minY = Math.min(...this.triangleOffsetsPattern.map(
            (triangle) => Math.min(...triangle.map((o) => o[1]))));
        const maxX = Math.max(...this.triangleOffsetsPattern.map(
            (triangle) => Math.max(...triangle.map((o) => o[0]))));
        const maxY = Math.max(...this.triangleOffsetsPattern.map(
            (triangle) => Math.max(...triangle.map((o) => o[1]))));
        const maxPeriodX = maxX - minX + 1;
        const maxPeriodY = maxY - minY + 1;

        const checkPeriodFits = (periodX : number, stepX : number, stepY : number) : number => {
            // returns the number of touching triangles
            const trianglesInShape : Triangle[] = [];
            const seen = new Set<string>();
            for (const t of this.triangleOffsetsPattern) {
                for (const o of t) {
                    // this triangle
                    const triangle = this.grid.getOrAddTriangle(o[0], o[1]);
                    trianglesInShape.push(triangle);
                    if (seen.has(`${o[0]} ${o[1]}`)) return -1;
                    seen.add(`${o[0]} ${o[1]}`);
                    const expectedShape = triangle.shape;

                    // check repetitions in both directions
                    for (let i=-periodX; i<2 * periodX; i++) {
                        for (let j=-2; j<3; j++) {
                            if (i==0 && j==0) continue;
                            const x = i * periodX + j * stepX + o[0];
                            const y = j * stepY + o[1];
                            const s = `${x} ${y}`;
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
                for (const n of this.grid.getTriangleNeighbors(t)) {
                    if (seen.has(`${n.x} ${n.y}`)) touching++;
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
