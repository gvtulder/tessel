
import { Tile, TileShape } from './Tile.js';
import { Coord, CoordId, Triangle, TriangleType } from './Triangle.js';
import { DEBUG } from '../settings.js';
import { Pattern } from './Pattern.js';

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
        return this.tiles.filter((t) => t.isPlaceholder());
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
     * Returns the tile at the tile-X and tile-Y position.
     *
     * @param x tile x
     * @param y tile y
     * @param addMissing create a new tile if necessary (if pattern is set)
     * @returns a new tile, or null if initialization was impossible
     */
    getTile(x : number, y : number, addMissing? : boolean) : Tile | null {
        const coordId = CoordId(x, y);
        let tile = this._tiles.get(coordId);
        if (!tile && addMissing && this.pattern) {
            tile = this.pattern.constructTile(this, x, y);
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
     * @returns a new tile, or null if initialization was impossible
     */
    getOrAddTile(x : number, y : number) : Tile {
        return this.getTile(x, y, true);
    }

    /**
     * Returns the neighbors of the given tile.
     *
     * @param tile the tile
     * @param addMissing create a new tile if necessary (if pattern is set)
     * @returns a list of neighbor tiles
     */
    getTileNeighbors(tile : Tile, addMissing? : boolean) : Tile[] {
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
                    const tile = this.getTile(...tileCoord, addMissing);
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
     * @returns a list of neighbor tiles
     */
    getOrAddTileNeighbors(tile : Tile) : Tile[] {
        return this.getTileNeighbors(tile, true);
    }

    /**
     * Creates placeholder tiles at the boundary of the current grid.
     *
     * Requires a pattern to be set.
     */
    updateFrontier() {
        for (const t of this._tiles.values()) {
            if (!t.isPlaceholder()) {
                this.getOrAddTileNeighbors(t);
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

    gridPositionToTriangleCoord(gridPos : Coord) : Coord {
        const triangle = this.getOrAddTriangle(0, 0);
        return triangle.mapGridPositionToTriangleCoord(gridPos);
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
