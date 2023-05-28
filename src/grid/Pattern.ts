import { wrapModulo } from "src/utils.js";
import { Grid } from "./Grid.js";
import { Tile, TileShape, TileVariant } from "./Tile.js";
import { Coord, CoordId, Triangle, TriangleType } from "./Triangle.js";


export type RotationSet = {
    rotationVariants : TileVariant[]
};

export class Pattern {
    triangleType : TriangleType;

    /**
     * The shape definition.
     */
    shapes : TileShape[];
    /**
     * The period of the pattern: the increase in the triangle-x direction
     * if the tile-x direction is increased with 1.
     */
    periodX : number;
    /**
     * The step size in triangle coordinates for a change in the tile y direction.
     */
    stepY : [number, number];

    /**
     * The number of color groups in this pattern.
     */
    numColorGroups : number;

    /**
     * Initializes a new pattern.
     *
     * @param triangleType the triangle / grid type
     * @param shapes a definition of the tiles in this pattern
     */
    constructor(triangleType : TriangleType, shapes : TileShape[]) {
        this.triangleType = triangleType;
        this.shapes = shapes;

        if (shapes) {
            // TODO what if there are multiple types of tile?
            this.numColorGroups = shapes[0].length;

            this.computeProperties();
        }
    }

    /**
     * Computes the properties (period, step etc.) of this pattern.
     */
    computeProperties() {
        const start = Date.now();
        const grid = new Grid(this.triangleType, this);
        this.computePeriods(grid);
        this.computeTileVariants(grid);
        grid.destroy();
        const end = Date.now();
        console.log(`Analyzed pattern in ${(end - start) / 1000} seconds`);
    }

    /**
     * Constructs a new tile at the given tile position.
     * 
     * @param grid the grid to create the tile in
     * @param x the tile x position
     * @param y the tile y position
     * @returns a new tile on the grid (must still be added)
     */
    constructTile(grid : Grid, x : number, y : number) : Tile {
        const patterns = this.shapes;
        const shapeIdx = wrapModulo(x, patterns.length);

        const triangles = patterns[shapeIdx].map((offsets) => (
            offsets.map(([offsetX, offsetY]) => {
                // the shapes are included in the tile-x direction
                // tile-x : [shape 0, shape 1, ...] [shape 0, shape 1, ...] ...
                //          [  pattern-x 0        ] [  pattern-x 1        ] ...
                // tile-y == pattern-y
                const triangleX = Math.floor(x / patterns.length) * this.periodX + y * this.stepY[0] + offsetX;
                const triangleY = y * this.stepY[1] + offsetY;
                return grid.getOrAddTriangle(triangleX, triangleY);
            })
        ));

        return new Tile(grid, x, y, triangles);
    }

    /**
     * Maps a triangle coordinate to a tile coordinate.
     *
     * @param triangle the triangle coordinate
     * @returns the tile coordinate
     */
    mapTriangleCoordToTileCoord(triangle : Coord) : Coord {
        const patterns = this.shapes;

        if (this.periodX == -1) return null;

        // patternX = (tileX - shapeIdx) / patterns.length;
        // triangleX = patternX * this.periodX + tileY * this.stepY[0] + offsetX;
        // triangleY = tileY * this.stepY[1] + offsetY;

        // deriving tileY:
        //   tileY = (triangleY - offsetY) / this.stepY[1]       // should be integer
        // deriving offsetY:
        //   offsetY = triangleY - tileY * this.stepY[1]

        // deriving tileX:
        //   patternX * this.periodX = triangleX - tileY * this.stepY[0] - offsetX;
        //   patternX = (triangleX - tileY * this.stepY[0] - offsetX) / this.periodX;
        //   (tileX - shapeIdx) = (triangleX - tileY * this.stepY[0] - offsetX) / this.periodX * patterns.length
        //   tileX = (triangleX - tileY * this.stepY[0] - offsetX) / this.periodX * patterns.length + shapeIdx
        // deriving offsetX:
        //   offsetX = triangleX - patternX * this.periodX - tileY * this.stepY[0];

        for (let shapeIdx=0; shapeIdx<this.shapes.length; shapeIdx++) {
            const shape = this.shapes[shapeIdx];
            for (const colorGroup of shape) {
                for (const offset of colorGroup) {
                    const tileY = Math.floor((triangle[1] - offset[1]) / this.stepY[1]);
                    const offsetY = triangle[1] - tileY * this.stepY[1];

                    const tileX = Math.floor(triangle[0] - tileY * this.stepY[0] - offset[0]) / this.periodX * patterns.length + shapeIdx;
                    const offsetX = triangle[0] - Math.floor(tileX / patterns.length) * this.periodX - tileY * this.stepY[0]
                    if (offset[0] == offsetX && offset[1] == offsetY) {
                        return [tileX, tileY];
                    }
                }
            }
        }
        return null;
    }

    /**
     * Compute the rotation variants of the tiles in this pattern.
     * @param grid a dummy grid to use for the computations
     */
    computeTileVariants(grid : Grid) {
        const variants : RotationSet[] = [];

        for (let shapeIdx=0; shapeIdx<this.shapes.length; shapeIdx++) {
            // construct a tile of this shape
            const tile = this.constructTile(grid, shapeIdx, 0);
            // compute the color-sensitive rotation variants
            const rotationVariants = tile.computeRotationVariants(true);

            let exists = false;
            for (const newVariant of rotationVariants) {
                // compare with the variants we already have
                exists = exists || variants.some((existingVariant) =>
                    tile.isEquivalentShape(existingVariant.rotationVariants[0].shape,
                                           newVariant.shape)
                );
                if (exists) break;
            }

            // this is a new variant
            if (!exists) {
                variants.push({
                    rotationVariants: rotationVariants
                });
            }
        }

        console.log('variants', variants);
    }

    /**
     * Computes the period and step size of the pattern, given the current shapes.
     * @param grid a dummy grid to use for the computations
     */
    computePeriods(grid : Grid) {
        // create one triangle to get the parameters
        const protoTriangle = grid.getOrAddTriangle(0, 0);
        const minGridPeriodX = protoTriangle.tileMinGridPeriodX;
        const minGridPeriodY = protoTriangle.tileMinGridPeriodY;
        const maxGridPeriodX = protoTriangle.tileGridPeriodX;
        const maxGridPeriodY = protoTriangle.tileGridPeriodY;

        // calculate the shapes of the triangle grid
        const triangleShapes : number[][] = [];
        for (let x=0; x<maxGridPeriodX; x++) {
            triangleShapes[x] = [];
            for (let y=0; y<maxGridPeriodY; y++) {
                const p = protoTriangle.getGridParameters(x, y);
                triangleShapes[x].push(p.shape);
            }
        }

        // combine all of the coordinates and shapes to a single tile
        type CoordIdPair = [x: number, y: number, coordId: CoordId, cost: number];
        // mark the closeness from the starting tile
        const MAX_DEPTH = 2 * (maxGridPeriodX + maxGridPeriodY);
        const scoreMap = new Map<CoordId, number>();
        const coordinates : Coord[] = [];
        const queue : CoordIdPair[] = [];
        for (const shape of this.shapes) {
            for (const coords of shape) {
                for (const coord of coords) {
                    const c = [coord[0], coord[1], `${coord[0]} ${coord[1]}`, MAX_DEPTH] as CoordIdPair;
                    coordinates.push(coord);
                    // a starting triangle
                    scoreMap.set(c[2], -1);
                    queue.push(c);
                }
            }
        }

        // compute the distance to the initial tile
        let maxTotalScore = 0;
        while (queue.length > 0) {
            const cur = queue.pop();
            // find the neighbors
            const params = protoTriangle.getGridParameters(cur[0], cur[1]);
            for (const n of params.neighborOffsets) {
                const neighborX = cur[0] + n[0];
                const neighborY = cur[1] + n[1];
                const neighborId = `${neighborX} ${neighborY}`;
                if (!scoreMap.has(neighborId)) {
                    scoreMap.set(neighborId, cur[3]);
                    maxTotalScore += cur[3];
                    if (cur[3] > 0) {
                        queue.push([neighborX, neighborY, neighborId, cur[3] - 1]);
                    }
                }
            }
        }
        console.log(`Marked ${scoreMap.size} neighbors. Maximum total score ${maxTotalScore}.`);
        console.log([...scoreMap.values()].reduce((a, b) => a + b));

        const checkPeriodFits = (periodX : number, stepX : number, stepY : number, bestScore : number) : number => {
            // returns the tightness of the pattern fit
            let totalScore = 0;
            for (let r=0; r<10; r++) {
                for (let j=-r; j<=r+1; j++) {
                    for (let i=-r; i<=r+1; i++) {
                        if ((j == 0 && i == 0)) continue;
                        if (i == -r || i == r && j == -r && j == r) {
                            for (let c=0; c<coordinates.length; c++) {
                                const coord = coordinates[c];
                                const x = i * periodX + j * stepX + coord[0];
                                const y = j * stepY + coord[1];

                                // not yet marked?
                                const coordScore = scoreMap.get(`${x} ${y}`);
                                // console.log('overlap!', coordCost, x, y, periodX, stepX, stepY, i, j, coord);
                                if (coordScore === -1) {
                                    return null;
                                }

                                // the triangle shapes should match
                                if (triangleShapes[((coord[0] % maxGridPeriodX) + maxGridPeriodX) % maxGridPeriodX][
                                                ((coord[1] % maxGridPeriodY) + maxGridPeriodY) % maxGridPeriodY] !=
                                    triangleShapes[((x % maxGridPeriodX) + maxGridPeriodX) % maxGridPeriodX][
                                                ((y % maxGridPeriodY) + maxGridPeriodY) % maxGridPeriodY]) {
                                    return null;
                                }

                                if (coordScore !== undefined && coordScore > 0) {
                                    totalScore += coordScore;
                                }
                            }
                        }
                    }
                }
            }
            return totalScore;
        }


        // estimate the range of coordinates
        const minX = Math.min(...coordinates.map((c) => c[0]));
        const maxX = Math.max(...coordinates.map((c) => c[0]));
        const minY = Math.min(...coordinates.map((c) => c[1]));
        const maxY = Math.max(...coordinates.map((c) => c[1]));
        // the pattern should definitely fit after this
        const maxPeriodX = 2 * Math.ceil((maxX - minX) / maxGridPeriodX) * maxGridPeriodX + maxGridPeriodX;
        const maxStepY = 2 * Math.ceil((maxY - minY) / maxGridPeriodY) * maxGridPeriodY + maxGridPeriodY;
        console.log(`Max period X: ${maxPeriodX}, max step Y: ${maxStepY}.`);

        /*
        this.periodX = 2;
        this.stepY = [1, 1];
        */

        let bestScore : number = null;
        let bestPeriodX : number = null;
        let bestStepX : number = null;
        let bestStepY : number = null;
        let tries = 0;

        for (let r=0; r<20; r++) {
            for (let i = 0; i < r + 1; i++) {
                const periodX = i;   // * minGridPeriodX;
                // if (periodX > maxPeriodX) continue;
                for (let stepX=-r; stepX<r+1; stepX++) {
                    // if (stepX < -periodX || stepX > periodX) continue;
                    for (let stepY=-r; stepY<r+1; stepY++) {
                        // if (stepX < -maxStepY|| stepX > maxStepY) continue;
                        // only try settings we have not yet tried
                        if (i == r || stepX == -r || stepX == r || stepY == -r || stepY == r) {
                            tries++;
                            const score = checkPeriodFits(periodX, stepX, stepY, bestScore);
                            // console.log(`Try periodX ${periodX} stepX ${stepX} stepY ${stepY} cost ${score}`);
                            if (score !== null) {
                                // console.log('fits', [periodX, stepX, stepY], cost);
                                if (bestPeriodX === null || score > bestScore ||
                                    (score == bestScore && Math.abs(stepX) < Math.abs(bestStepX)) ||
                                    (score == bestScore && Math.abs(stepX) == Math.abs(bestStepX) && Math.abs(stepY) == Math.abs(bestStepY))) {
                                    bestPeriodX = periodX;
                                    bestStepX = stepX;
                                    bestStepY = stepY;
                                    bestScore = score;
                                }
                            }
                        }
                    }
                }
            }
        }

        this.periodX = bestPeriodX;
        this.stepY = [bestStepX, bestStepY];
        console.log(`Best period: ${this.periodX} with step (${this.stepY[0]}, ${this.stepY[1]}), score ${bestScore}. Evaluated ${tries} options.`, 'min-max y', [minX, maxX], 'min-max y', [minY, maxY]);

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
