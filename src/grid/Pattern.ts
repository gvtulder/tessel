import { shiftCoordinates2, wrapModulo } from "../utils.js";
import { Grid } from "./Grid.js";
import { Tile, TileShape, TileType, TileVariant } from "./Tile.js";
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
     * The rotation variants of the shapes in this pattern.
     */
    rotationVariants : RotationSet[];

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
     * Constructs a new tile of the given shape.
     * 
     * @param grid the grid to create the tile in
     * @param shapeIdx the shape to generate
     * @param offsetX the x triangle offset
     * @param offsetY the y triangle offset
     * @param type the type of the new tile
     * @returns a new tile on the grid (must still be added)
     */
    constructTile(grid : Grid, shapeIdx : number, offsetX : number, offsetY : number, type : TileType) : Tile {
        const patterns = this.shapes;

        const triangles = patterns[shapeIdx].map((offsets) => (
            offsets.map(([x, y]) => {
                // the shapes are included in the tile-x direction
                // tile-x : [shape 0, shape 1, ...] [shape 0, shape 1, ...] ...
                //          [  pattern-x 0        ] [  pattern-x 1        ] ...
                // tile-y == pattern-y
                const triangleX = offsetX + x;
                const triangleY = offsetY + y;
                return grid.getOrAddTriangle(triangleX, triangleY);
            })
        ));

        return new Tile(grid, type, triangles);
    }

    /**
     * Maps a triangle coordinate to a tile coordinate.
     *
     * @param triangle the triangle coordinate
     * @returns the tile coordinate
     * @deprecated
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
     * Returns a list of the tile shapes that could be placed
     * at the given triangle.
     *
     * @param grid the grid
     * @param triangle the triangle
     * @param checkOccupied return only shapes that fit on empty triangles
     * @returns a list of possible tile shapes
     */
    computePossibleTiles(grid : Grid, triangle : Triangle, checkOccupied? : boolean) {
        const shapes : TileShape[] = [];
        for (const rotationSet of this.rotationVariants) {
            for (const variant of rotationSet.rotationVariants) {
                for (let c=0; c<variant.shape.length; c++) {
                    for (let i=0; i<variant.shape[c].length; i++) {
                        if (variant.triangleShapes[c][i] === triangle.shape) {
                            // this could fit on this triangle
                            const shift = [
                                triangle.x - variant.shape[c][i][0],
                                triangle.y - variant.shape[c][i][1],
                            ] as Coord;
                            const shiftedShape = shiftCoordinates2(variant.shape, shift);
                            let ok = true;
                            if (checkOccupied) {
                                // check if these triangles are still empty
                                for (const g of shiftedShape) {
                                    for (const t of g) {
                                        const triangle = grid.getTriangle(t[0], t[1]);
                                        if (triangle && triangle.tile && triangle.tile.type !== TileType.Placeholder) {
                                            ok = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (ok) {
                                shapes.push(shiftedShape);
                            }
                        }
                    }
                }
            }
        }
        return shapes;
    }

    /**
     * @deprecated Move the grid logic from Tile and Grid.
     * @param grid a dummy grid to use for the computations
     * @param shape 
     * @returns 
     */
    checkIncludesShape(shape : TileShape, grid? : Grid) : boolean {
        // TODO precompute
        if (!grid) grid = new Grid(this.triangleType, this);
        let shapesInPattern : TileShape[] = null;
        shapesInPattern = this.shapes.map(
            (shape) => grid.moveToOrigin(shape)
        );
        const existsInPattern = shapesInPattern.some(
            (shapeInPattern) => Grid.isEquivalentShape(shapeInPattern, shape)
        );
        return existsInPattern;
    }

    /**
     * Compute the rotation variants of the tiles in this pattern.
     * @param grid a dummy grid to use for the computations
     */
    computeTileVariants(grid? : Grid) {
        if (!grid) grid = new Grid(this.triangleType, this);
        const variants : RotationSet[] = [];

        for (let shapeIdx=0; shapeIdx<this.shapes.length; shapeIdx++) {
            // compute the color-sensitive rotation variants
            const triangles = grid.shapeToTriangles(this.shapes[shapeIdx]);
            const rotationVariants = Grid.computeRotationVariants(triangles, true, this);

            let exists = false;
            for (const newVariant of rotationVariants) {
                // compare with the variants we already have
                exists = exists || variants.some((existingVariant) =>
                    Grid.isEquivalentShape(
                        existingVariant.rotationVariants[0].shape,
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

        this.rotationVariants = variants;
        console.log('variants', variants);
    }

    /**
     * Computes the period and step size of the pattern, given the current shapes.
     * @param grid a dummy grid to use for the computations
     */
    computePeriods(grid? : Grid) {
        if (!grid) grid = new Grid(this.triangleType, this);
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
        const coordinates : Coord[] = [];
        for (const shape of this.shapes) {
            for (const coords of shape) {
                for (const coord of coords) {
                    coordinates.push(coord);
                }
            }
        }
        console.log(this.shapes);
        console.log('Pattern coordinates:', coordinates);

        // compute the size of the pattern
        const shapeMinX = Math.min(...coordinates.map((c) => c[0]));
        const shapeMaxX = Math.max(...coordinates.map((c) => c[0]));
        const shapeMinY = Math.min(...coordinates.map((c) => c[1]));
        const shapeMaxY = Math.max(...coordinates.map((c) => c[1]));
        console.log(`Pattern bounds: x [${shapeMinX} ${shapeMaxX}] y [${shapeMinY} ${shapeMaxY}].`);

        // define the scoring region
        const roiMinX = shapeMinX - (shapeMaxX - shapeMinX) - 2 * maxGridPeriodX;
        const roiMaxX = shapeMaxX + (shapeMaxX - shapeMinX) + 2 * maxGridPeriodX;
        const roiMinY = shapeMinY - (shapeMaxY - shapeMinY) - 2 * maxGridPeriodY;
        const roiMaxY = shapeMaxY + (shapeMaxY - shapeMinY) + 2 * maxGridPeriodY;
        const maxScore = (roiMaxX - roiMinX) * (roiMaxY - roiMinY);
        console.log(`Pattern ROI: x [${roiMinX} ${roiMaxX}] y [${roiMinY} ${roiMaxY}]. Max score: ${maxScore}.`);

        const checkPeriodFits = (periodX : number, stepX : number, stepY : number) : number => {
            // returns the tightness of the pattern fit
            // keep track of the triangles that we already used
            const marked = new Set<CoordId>();
            // keep track of the pattern repetitions we've marked so far
            const tried = new Set<CoordId>();
            const queue : Coord[] = [];
            // have we already placed any triangles?
            let stillExploring = true;

            // start with pattern [0,0]
            tried.add('0 0');
            queue.push([0, 0]);

            while (queue.length > 0) {
                // get the next x, y tile coordinate to try
                const tileCoord = queue.shift();

                // place the triangles for this tile
                let anyMarked = false;
                for (let c=0; c<coordinates.length; c++) {
                    const coord = coordinates[c];
                    const x = tileCoord[0] * periodX + tileCoord[1] * stepX + coord[0];
                    const y = tileCoord[1] * stepY + coord[1];

                    if (x < roiMinX || roiMaxX <= x || y < roiMinY || roiMaxY <= y) {
                        continue;
                    }

                    const coordId = `${x} ${y}`;

                    // not yet marked?
                    if (marked.has(coordId)) {
                        return null;
                    }

                    // the triangle shapes should match
                    if (triangleShapes[((coord[0] % maxGridPeriodX) + maxGridPeriodX) % maxGridPeriodX][
                                    ((coord[1] % maxGridPeriodY) + maxGridPeriodY) % maxGridPeriodY] !=
                        triangleShapes[((x % maxGridPeriodX) + maxGridPeriodX) % maxGridPeriodX][
                                    ((y % maxGridPeriodY) + maxGridPeriodY) % maxGridPeriodY]) {
                        return null;
                    }

                    marked.add(coordId);
                    anyMarked = true;
                }

                if (anyMarked) {
                    // from now on, only work with parameters that reach the ROI
                    stillExploring = false;
                }

                // was this a good coordinate? or are we still exploring?
                if (anyMarked || stillExploring) {
                    // add the neighboring parameters to the queue
                    for (let newI=-1; newI<=1; newI++) {
                        for (let newJ=-1; newJ<=1; newJ++) {
                            const newTileCoord : Coord = [newI + tileCoord[0], newJ + tileCoord[1]];
                            const newTileCoordId = CoordId(newTileCoord);
                            if (!tried.has(newTileCoordId)) {
                                tried.add(newTileCoordId);
                                queue.push(newTileCoord);
                            }
                        }
                    }
                }
            }

            return marked.size;
        }

        let bestScore : number = null;
        let bestPeriodX : number = null;
        let bestStepX : number = null;
        let bestStepY : number = null;
        let tries = 0;

        // estimates
        const maxShapeGridPeriodX = 2 * (shapeMaxX - shapeMinX) + maxGridPeriodX + 1;
        const maxShapeStepX = maxShapeGridPeriodX;
        const maxShapeStepY = 2 * (shapeMaxY - shapeMinY) + maxGridPeriodY + 1;
        console.log('maxShapeGridPeriodX', maxShapeGridPeriodX);
        console.log('maxShapeStepX', maxShapeStepX);
        console.log('maxShapeStepY', maxShapeStepY);

        for (let r=0; r<20; r++) {
            for (let stepX=-r; stepX<=r; stepX++) {
                if (bestScore == maxScore) break;
                for (let stepY=-r; stepY<=r; stepY++) {
                    if (!(stepX==-r || stepX==r || stepY==-r || stepY==r)) break;
                    if (bestScore == maxScore) break;
                    for (let periodX=0; periodX<maxShapeGridPeriodX; periodX++) {
                        if (bestScore == maxScore) break;
                        tries++;
                        const score = checkPeriodFits(periodX, stepX, stepY);
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

        this.periodX = bestPeriodX;
        this.stepY = [bestStepX, bestStepY];
        console.log(`Best period: ${this.periodX} with step (${this.stepY[0]}, ${this.stepY[1]}), score ${bestScore}. Evaluated ${tries} options.`);
    }
}
