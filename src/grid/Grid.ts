
import { Tile, TileShape, TileType, TileVariant } from './Tile.js';
import { ColorGroup, Coord, CoordId, Edge, Triangle, TriangleType } from './Triangle.js';
import { DEBUG } from '../settings.js';
import { Pattern } from './Pattern.js';
import { shiftCoordinates2, wrapModulo } from 'src/utils.js';

const COLORS = ['black', 'red', 'blue', 'grey', 'green', 'brown', 'orange', 'purple', 'pink'];





export class GridEvent extends Event {
    grid : Grid;
    triangle? : Triangle;
    tile? : Tile;
    oldX? : number;
    oldY? : number;

    constructor(type : string, grid : Grid, triangle : Triangle, tile : Tile, oldX? : number, oldY? : number) {
        super(type);
        this.grid = grid;
        this.triangle = triangle;
        this.tile = tile;
        this.oldX = oldX;
        this.oldY = oldY;
    }
}

export class Grid extends EventTarget {
    static events = {
        AddTriangle: 'addtriangle',
        AddTile: 'addtile',
        RemoveTile: 'removetile',
    };

    triangleType : TriangleType;
    pattern : Pattern;

    private _triangles : Map<CoordId, Triangle>;
    // TODO change to set?
    private _tiles : Map<CoordId, Tile>;

    /**
     * Initializes a new grid.
     *
     * @param triangleType the triangle type (defines the grid)
     * @param pattern the tile pattern for the grid
     */
    constructor(triangleType : TriangleType, pattern : Pattern) {
        super();

        this.triangleType = triangleType;
        this.pattern = pattern;

        this._triangles = new Map<CoordId, Triangle>();
        this._tiles = new Map<CoordId, Tile>();

        if (DEBUG.RANDOM_TRIANGLES) {
            this.createRandomTriangles();
        }
        if (DEBUG.WHITE_TRIANGLES) {
            this.fillTrianglesWithWhite();
        }
        if (DEBUG.RANDOM_TILES) {
            this.createRandomTiles();
        }
    }

    destroy() {
        this._tiles.clear();
        this._triangles.clear();
    }

    get tiles() : Tile[] {
        return [...this._tiles.values()];
    }

    get triangles() : Triangle[] {
        return [...this._triangles.values()];
    }

    /**
     * The list of placeholder tiles.
     */
    get placeholderTiles() : Tile[] {
        return this.getTilesWithType(TileType.Placeholder);
    }

    /**
     * Returns all tiles with a the requested type.
     * @param type a tile type
     * @returns all types of the given type
     */
    getTilesWithType(type : TileType) : Tile[] {
        return this.tiles.filter((t) => t.type === type);
    }

    /**
     * Returns the triangle at the given coordinate.
     *
     * @param x
     * @param y
     * @param addMissing initialize the triangle if necessary
     * @returns the triangle
     */
    getTriangle(x : number, y : number, addMissing? : boolean) : Triangle | null {
        const coordId = CoordId(x, y);
        let triangle = this._triangles.get(coordId);
        if (!triangle && addMissing) {
            triangle = new this.triangleType(this, x, y);
            this._triangles.set(coordId, triangle);
            this.dispatchEvent(new GridEvent(Grid.events.AddTriangle, this, triangle, null));
        }
        return triangle;
    }

    /**
     * Returns the triangle at the given coordinate.
     * Initializes the triangle if necessary.
     *
     * @param x
     * @param y
     * @returns the triangle
     */
    getOrAddTriangle(x : number, y : number) : Triangle {
        return this.getTriangle(x, y, true);
    }

    /**
     * Adds a tile to the grid.
     * @param tile the new tile
     */
    addTile(tile : Tile) {
        this._tiles.set(CoordId(tile.x, tile.y), tile);
        this.dispatchEvent(new GridEvent(Grid.events.AddTile, this, null, tile));
    }

    /**
     * Removes a tile from the grid.
     * @param tile the new tile
     */
    removeTile(tile : Tile) {
        this._tiles.delete(CoordId(tile.x, tile.y));
        tile.removeFromGrid();
        this.dispatchEvent(new GridEvent(Grid.events.RemoveTile, this, null, tile));
    }

    /**
     * Remove all tiles from the grid.
     */
    removeAllTiles() {
        for (const tile of this._tiles.values()) {
            this.removeTile(tile);
        }
    }

    /**
     * Returns the tile at the tile-X and tile-Y position.
     *
     * @param x tile x
     * @param y tile y
     * @param addMissing create a new tile if necessary (if pattern is set)
     * @param type the tile type if a new tile is added
     * @returns a new tile, or null if initialization was impossible
     */
    getTile(x : number, y : number, addMissing? : boolean, type? : TileType) : Tile | null {
        const coordId = CoordId(x, y);
        let tile = this._tiles.get(coordId);
        if (!tile && addMissing && this.pattern) {
            tile = this.pattern.constructTile(this, x, y, type);
            this.addTile(tile);
        }
        return tile;
    }

    /**
     * Returns the tile at the tile-X and tile-Y position.
     * Creates a new tile if necessary, and if a pattern is set.
     *
     * @param x tile x
     * @param y tile y
     * @param type the tile type if a new tile is added
     * @returns a new tile, or null if initialization was impossible
     */
    getOrAddTile(x : number, y : number, type : TileType) : Tile {
        return this.getTile(x, y, true, type);
    }

    /**
     * Returns the neighbors of the given tile.
     *
     * @param tile the tile
     * @param addMissing create a new tile if necessary (if pattern is set)
     * @param type the type of any new tiles
     * @returns a list of neighbor tiles
     */
    getTileNeighbors(tile : Tile, addMissing? : boolean, type? : TileType) : Tile[] {
        const tiles : Tile[] = [];
        const seen = new Set<CoordId>();
        for (const triangle of tile.getNeighborTriangles()) {
            const tileCoord =
                triangle.tile ?
                triangle.tile.coord :
                (this.pattern ?
                    this.pattern.mapTriangleCoordToTileCoord(triangle.coord) :
                    null);

            if (tileCoord) {
                const coordId = CoordId(tileCoord);
                if (!seen.has(coordId)) {
                    seen.add(coordId);
                    const tile = this.getTile(...tileCoord, addMissing, type);
                    if (tile) tiles.push(tile);
                }
            }
        }
        return tiles;
    }

    /**
     * Returns the neighbors of the given tile.
     * Initializing missing tiles if a pattern is set.
     *
     * @param tile the tile
     * @param type the type of any new tiles
     * @returns a list of neighbor tiles
     */
    getOrAddTileNeighbors(tile : Tile, type : TileType) : Tile[] {
        return this.getTileNeighbors(tile, true, type);
    }

    /**
     * Creates placeholder tiles at the boundary of the current grid.
     *
     * Requires a pattern to be set.
     */
    updateFrontier() {
        for (const t of this._tiles.values()) {
            if (t.type !== TileType.Placeholder) {
                this.getOrAddTileNeighbors(t, TileType.Placeholder);
            }
        }
    }

    /**
     * Convert the shape coordinates to triangles by
     * calling this.getOrAddTriangle.
     *
     * @param shape the shape coordinates
     * @returns triangles in the same order
     */
    shapeToTriangles(shape : TileShape) : Triangle[] {
        const triangles : Triangle[] = [];
        for (const g of shape) {
            triangles.push(...g.map((c) => this.getOrAddTriangle(...c)));
        }
        return triangles;
    }

    /**
     * Maps a grid position to a triangle coordinate.
     * @param gridPos the grid position
     * @returns the triangle coordinate
     */
    gridPositionToTriangleCoord(gridPos : Coord) : Coord {
        const triangle = this.getOrAddTriangle(0, 0);
        return triangle.mapGridPositionToTriangleCoord(gridPos);
    }



    // triangle calculations

    /**
     * Shifts the triangles if this results in a valid shape.
     * 
     * @param triangles input triangles
     * @param shift the shift to apply
     * @returns (original -> new) triangle map, or null if the shift is invalid
     */
    static shiftToMatch(triangles : readonly Triangle[], shift : Coord) : Map<Triangle, Triangle> {
        const map = new Map<Triangle, Triangle>();
        for (const triangle of triangles) {
            const newTriangle = triangle.grid.getOrAddTriangle(
                triangle.x + shift[0],
                triangle.y + shift[1]
            );
            if (triangle.shape != newTriangle.shape) return null;
            map.set(triangle, newTriangle);
        }
        return map;
    }

    /**
     * Computes the offsets if the tile is rotated.
     * Maps starting from edgeFrom to edgeTo.
     * 
     * @param triangles a set of (connected) triangles
     * @param edgeFrom source rotation edge
     * @param edgeTo target rotation edge
     * @returns map of source to target triangles
     */
    static computeRotatedTrianglePairs(triangles : Triangle[], edgeFrom : Edge, edgeTo : Edge) : Map<Triangle, Triangle> {
        const map = new Map<Triangle, Triangle>();
        const todo = new Set<Triangle>(triangles);
        map.set(edgeFrom.from, edgeTo.from);
        map.set(edgeFrom.to, edgeTo.to);
        const queue : [Edge, Edge][] = [[edgeFrom, edgeTo]];
        while (queue.length > 0) {
            const [edgeFrom, edgeTo] = queue.pop();
            const sourceNeighbors = edgeFrom.to.getOrAddNeighbors();
            const targetNeighbors = edgeTo.to.getOrAddNeighbors();
            const prevSrcIdx = sourceNeighbors.indexOf(edgeFrom.from);
            const prevTgtIdx = targetNeighbors.indexOf(edgeTo.from);
            for (let i=0; i<sourceNeighbors.length; i++) {
                const neighbor = sourceNeighbors[i];
                if (neighbor && todo.has(neighbor)) {
                    const newIdx = wrapModulo(i + prevTgtIdx - prevSrcIdx, sourceNeighbors.length);
                    const newTarget = targetNeighbors[newIdx];
                    map.set(neighbor, newTarget);
                    queue.push([
                        { from: edgeFrom.to, to: neighbor },
                        { from: edgeTo.to, to: newTarget },
                    ]);
                    todo.delete(neighbor);
                }
            }
        }
        // only return the triangles of this tile
        const result = new Map<Triangle, Triangle>();
        for (const triangle of triangles) {
            result.set(triangle, map.get(triangle));
        }
        return result;
    }

    /**
     * Normalizes the shape offsets by shifting the top-left triangle to (0, 0).
     * (Or as close as possible as the grid type allows.)
     *
     * @param shape the input shape
     * @returns the normalized shape
     */
    moveToOrigin(shape: TileShape) : TileShape {
        const triangles = this.shapeToTriangles(shape);
        const shift = Grid.computeShiftToOrigin(triangles);
        return shiftCoordinates2(shape, shift);
    }

    /**
     * Normalizes the triangle set by shifting the top-left triangle to (0, 0).
     * (Or as close as possible as the grid type allows.)
     * 
     * @param triangles the input triangles
     * @returns map of input -> normalized triangles
     */
    static mapTrianglesToOrigin(triangles : readonly Triangle[]) : Map<Triangle, Triangle> {
        const shift = this.computeShiftToOrigin(triangles);
        return new Map<Triangle, Triangle>(
            triangles.map((from) => [
                from,
                from.grid.getOrAddTriangle(
                    from.x + shift[0],
                    from.y + shift[1]
                )
            ])
        );
    }

    /**
     * Computes the shift that normalizes the triangle set by moving
     * the top-left triangle to (0, 0).
     * (Or as close as possible as the grid type allows.)
     *
     * @param triangles the input triangles
     * @returns the offset
     */
    static computeShiftToOrigin(triangles : readonly Triangle[]) : Coord {
        const topLeft = this.findTopLeftTriangle(triangles);
        return [
            topLeft.xAtOrigin - topLeft.x,
            topLeft.yAtOrigin - topLeft.y,
        ];
    }

    /**
     * Returns the triangle that is closest to the origin: the top-left triangle.
     * (Or as close to the origin as possible as the grid type allows.)
     *
     * @param triangles the input triangles
     * @returns the anchor triangle
     */
    static findTopLeftTriangle(triangles : readonly Triangle[]) : Triangle {
        let topLeft : Triangle = null;
        for (const t of triangles) {
            if (topLeft == null) {
                topLeft = t;
            } else {
                // select a standard, repeatable origin
                const cmpAtOrigin = (t.xAtOrigin - topLeft.xAtOrigin) || (t.yAtOrigin - topLeft.yAtOrigin);
                const cmpAbsolute = (t.x - topLeft.x) || (t.y - topLeft.y);
                if ((cmpAtOrigin || cmpAbsolute) < 0) {
                    topLeft = t;
                }
            }
        }
        return topLeft;
    }

    /**
     * Computes the unique rotation variants of this tile, taking into account
     * the shape and color groups.
     *
     * @param triangles the set of connected triangles
     * @param colorSensitive the color groups should match exactly
     * @param patternSensitive only return shapes that are included in this pattern
     * @returns a list of unique rotation variants
     */
    computeRotationVariants(triangles : Triangle[], colorSensitive? : boolean, patternSensitive? : boolean) : TileVariant[] {
        return Grid.computeRotationVariants(triangles, colorSensitive, patternSensitive ? this.pattern : null);
    }

    /**
     * Computes the unique rotation variants of this tile, taking into account
     * the shape and color groups.
     *
     * @param triangles the set of connected triangles
     * @param colorSensitive the color groups should match exactly
     * @param pattern only return shapes that are included in this pattern
     * @returns a list of unique rotation variants
     */
    static computeRotationVariants(triangles : Triangle[], colorSensitive? : boolean, pattern? : Pattern) : TileVariant[] {
        const originTriangle = triangles[0];
        const rotationAngles = originTriangle.rotationAngles;
        const variants : TileVariant[] = [];
        const edgeFrom = originTriangle.getOrAddRotationEdge(0);

        // try every possible rotation for this grid type
        for (let r=0; r<rotationAngles.length; r++) {
            // apply rotation
            const edgeTo = originTriangle.getOrAddRotationEdge(r);
            if (!edgeTo) continue;
            const rotationMap = this.computeRotatedTrianglePairs(triangles, edgeFrom, edgeTo);

            // normalize the coordinates by moving the shape
            const shiftMap = this.mapTrianglesToOrigin([...rotationMap.values()]);

            // collect the offsets per color group
            const shape : TileShape = [];
            for (const triangle of triangles) {
                if (!shape[triangle.colorGroup]) shape[triangle.colorGroup] = [];
                shape[triangle.colorGroup].push(
                    shiftMap.get(rotationMap.get(triangle)).coord);
            }

            // construct the normalized variant
            const newVariant : TileVariant = {
                rotation: {
                    steps: r,
                    angle: rotationAngles[r]
                },
                shape: shape,
            };

            // does this exist in the pattern?
            if (pattern && !pattern.checkIncludesShape(newVariant.shape)) {
                continue;
            }

            // unique shape?
            const unique = variants.every(
                (variant) => !this.isEquivalentShape(variant.shape, newVariant.shape, colorSensitive)
            );
            if (unique) {
                variants.push(newVariant);
            }
        }
        return variants;
    }

    /**
     * Compares two rotations for shape and color groups.
     * 
     * @param a tile variant A
     * @param b tile variant B
     * @param colorSensitive color groups should match
     * @returns true if the variants have matching shape and color groups
     */
    static isEquivalentShape(a : TileShape, b : TileShape, colorSensitive? : boolean) {
        // assumption: normalized shapes, moved to origin

        // must have same number of color groups
        if (a.length != b.length) return false;

        // must have the same points in the same color groups,
        // but the color groups could be numbered differently
        const coordColorInA = new Map<CoordId, ColorGroup>();
        const colorAtoB = new Map<ColorGroup, ColorGroup>();
        let triangleCountA = 0;
        for (let c=0; c<a.length; c++) {
            for (const offset of a[c]) {
                coordColorInA.set(CoordId(offset), c);
                triangleCountA++;
            }
        }

        // should the color groups be in the same order?
        if (colorSensitive) {
            for (const colorGroup of coordColorInA.values()) {
                colorAtoB.set(colorGroup, colorGroup);
            }
        }

        // compare with color groups in B
        let triangleCountB = 0;
        for (let c=0; c<b.length; c++) {
            for (const offset of b[c]) {
                // look up color of this triangle in A
                const colorInA = coordColorInA.get(CoordId(offset));
                // triangle must exist in A
                if (colorInA === null || colorInA === undefined) return false;
                // check if it is the correct color group
                let colorInB = colorAtoB.get(colorInA);
                if (colorInB === null || colorInB === undefined) {
                    // new color group in B
                    colorAtoB.set(colorInA, c);
                    colorInB = c;
                }
                if (colorInB != c) return false;
                triangleCountB++;
            }
        }

        return triangleCountA == triangleCountB;
    }



    // debugging code

    private createRandomTriangles() {
        let i = 0;
        for (let row=0; row<24; row++) {
            for (let col=0; col<12; col++) {
                const triangle = this.getOrAddTriangle(col, row);
                triangle.color = COLORS[i % COLORS.length];
                i++;
            }
        }
    }

    private fillTrianglesWithWhite() {
        let i = 0;
        for (const triangle of this._triangles.values()) {
            triangle.color = 'white';
            triangle.color = ['#aaa', '#888', '#ccc'][i % 3];
            i++;
        }
    }

    private createRandomTiles() {
        /*
        let i = 0;
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                const tile = new this.gridType.createTile(this, x, y);
                const color = COLORS[i % COLORS.length];
                tile.colors = [color, color, color, color, color, color];
                this.addTile(tile);
                i++;
            }
        }
        */
    }
}
