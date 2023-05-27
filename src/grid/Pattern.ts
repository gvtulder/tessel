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
    readonly numColorGroups : number;

    /**
     * Dummy grid for computations.
     */
    private grid : Grid;

    /**
     * Initializes a new pattern.
     *
     * @param triangleType the triangle / grid type
     * @param shapes a definition of the tiles in this pattern
     */
    constructor(triangleType : TriangleType, shapes : TileShape[]) {
        this.triangleType = triangleType;
        this.grid = new Grid(triangleType, this);
        this.shapes = shapes;

        // TODO what if there are multiple types of tile?
        this.numColorGroups = shapes[0].length;

        this.computeProperties();
    }

    /**
     * Computes the properties (period, step etc.) of this pattern.
     */
    computeProperties() {
        this.computePeriods();
        this.computeTileVariants();
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
     */
    computeTileVariants() {
        const variants : RotationSet[] = [];

        for (let shapeIdx=0; shapeIdx<this.shapes.length; shapeIdx++) {
            // construct a tile of this shape
            const tile = this.constructTile(this.grid, shapeIdx, 0);
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
     */
    computePeriods() {
        const allX : number[] = [];
        const allY : number[] = [];
        for (const shape of this.shapes) {
            for (const colorGroup of shape) {
                for (const offset of colorGroup) {
                    allX.push(offset[0]);
                    allY.push(offset[1]);
                }
            }
        }
        const minX = Math.min(...allX);
        const minY = Math.min(...allY);
        const maxX = Math.max(...allX);
        const maxY = Math.max(...allY);
        const maxPeriodX = maxX - minX + 1;
        const maxPeriodY = maxY - minY + 1;

        const checkPeriodFits = (periodX : number, stepX : number, stepY : number) : number => {
            // returns the number of touching triangles
            const trianglesInShape : Triangle[] = [];
            const seen = new Set<string>();
            for (const shape of this.shapes) {
                for (const colorGroup of shape) {
                    for (const offset of colorGroup) {
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

        for (let r=0; r<10; r++) {
            for (let periodX=1; periodX<r+1; periodX++) {
                for (let stepX=-r; stepX<r+1; stepX++) {
                    for (let stepY=-r; stepY<r+1; stepY++) {
                        if (periodX == r || stepX == -r || stepX == r || stepY == -r || stepY == r) {
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
                        }
                    }
                }
            }
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
