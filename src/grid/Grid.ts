
import { Tile } from './Tile.js';
import { CoordId, Triangle, TriangleType } from './Triangle.js';
import { GridDisplay } from '../ui/GridDisplay.js';
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

    triangles : Map<CoordId, Triangle>;
    // @deprecated  change to set
    tiles : Map<CoordId, Tile>;

    div : HTMLDivElement;
    gridDisplay : GridDisplay;

    constructor(triangleType : TriangleType, pattern? : Pattern) {
        super();

        this.triangleType = triangleType;
        this.pattern = pattern;

        this.triangles = new Map<CoordId, Triangle>();
        this.tiles = new Map<CoordId, Tile>();

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

    getTriangle(x : number, y : number, addMissing? : boolean) : Triangle | null {
        const coordId = CoordId(x, y);
        let triangle = this.triangles.get(coordId);
        if (!triangle && addMissing) {
            triangle = new this.triangleType(this, x, y);
            this.triangles.set(coordId, triangle);
            this.dispatchEvent(new GridEvent(Grid.events.AddTriangle, this, triangle, null));
        }
        return triangle;
    }

    getOrAddTriangle(x : number, y : number) : Triangle {
        return this.getTriangle(x, y, true);
    }

    addTile(tile : Tile) {
        this.tiles.set(CoordId(tile.x, tile.y), tile);
        this.dispatchEvent(new GridEvent(Grid.events.AddTile, this, null, tile));
    }

    removeTile(tile : Tile) {
        this.tiles.delete(CoordId(tile.x, tile.y));
        tile.removeFromGrid();
        this.dispatchEvent(new GridEvent(Grid.events.RemoveTile, this, null, tile));
    }

    getTile(x : number, y : number, addMissing? : boolean) : Tile | null {
        if (!this.pattern) return null;
        const coordId = CoordId(x, y);
        let tile = this.tiles.get(coordId);
        if (!tile && addMissing) {
            tile = this.pattern.constructTile(this, x, y);
            this.addTile(tile);
        }
        return tile;
    }

    getOrAddTile(x : number, y : number) : Tile {
        return this.getTile(x, y, true);
    }

    getTileNeighbors(tile : Tile, addMissing? : boolean) : Tile[] {
        if (!this.pattern) return [];
        const tiles : Tile[] = [];
        const seen = new Set<CoordId>();
        for (const triangle of tile.getNeighborTriangles()) {
            const tileCoord = this.pattern.mapTriangleCoordToTileCoord(triangle.coord);
            const coordId = CoordId(tileCoord);
            if (!seen.has(coordId)) {
                seen.add(coordId);
                const tile = this.getTile(...tileCoord, addMissing);
                if (tile) tiles.push(tile);
            }
        }
        return tiles;
    }

    getOrAddTileNeighbors(tile : Tile) : Tile[] {
        return this.getTileNeighbors(tile, true);
    }

    updateFrontier() {
        for (const t of this.tiles.values()) {
            if (!t.isPlaceholder()) {
                this.getOrAddTileNeighbors(t);
            }
        }
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
        for (const triangle of this.triangles.values()) {
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
