
import { Tile } from './Tile.js';
import { Triangle } from './Triangle.js';
import { GridDisplay } from '../ui/GridDisplay.js';
import { DEBUG } from '../settings.js';
import { GridType } from './GridType.js';
import { EditableTile } from 'src/ui/TileEditorDisplay.js';

const COLORS = ['black', 'red', 'blue', 'grey', 'green', 'brown', 'orange', 'purple', 'pink'];


export type TriangleColor = string;
export type TileColors = TriangleColor[];


export type Coord = [x : number, y : number];



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
    gridType : GridType;

    grid : Triangle[][];
    triangles : Triangle[];
    tiles : Tile[];
    tileGrid : Tile[][];

    div : HTMLDivElement;
    gridDisplay : GridDisplay;

    constructor(gridType : GridType) {
        super();

        this.gridType = gridType;
        this.grid = [];
        this.triangles = [];
        this.tiles = [];
        this.tileGrid = [];

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

    getTriangle(x : number, y : number) : Triangle | null {
        if (!this.grid[x]) return null;
        if (!this.grid[x][y]) return null;
        return this.grid[x][y];
    }

    getOrAddTriangle(x : number, y : number) : Triangle {
        if (!this.grid[x]) this.grid[x] = [];
        if (!this.grid[x][y]) {
            const triangle = new this.gridType.createTriangle(x, y);
            this.grid[x][y] = triangle;
            this.triangles.push(triangle);
            this.dispatchEvent(new GridEvent('addtriangle', this, triangle, null));
        }
        return this.grid[x][y];
    }

    addTile(tile : Tile) {
        if (!this.tileGrid[tile.x]) this.tileGrid[tile.x] = [];
        this.tileGrid[tile.x][tile.y] = tile;
        this.tiles.push(tile);
        this.dispatchEvent(new GridEvent('addtile', this, null, tile));
    }

    removeTile(tile : Tile) {
        const idx = this.tiles.indexOf(tile);
        if (idx > -1) this.tiles.splice(idx, 1);
        this.tileGrid[tile.x][tile.y] = null;
        tile.removeFromGrid();
        this.dispatchEvent(new GridEvent('removetile', this, null, tile));
    }

    moveTile(tile : EditableTile, x : number, y : number) {
        // this only works for the editable tiles
        // assumption: triangles are updated elsewhere
        const oldX = tile.x;
        const oldY = tile.y;
        if (this.tileGrid[x][y]) {
            this.removeTile(this.tileGrid[x][x]);
        }
        this.tileGrid[oldX][oldY] = null;
        this.tileGrid[x][y] = tile;
        tile.x = x;
        tile.y = y;
        this.dispatchEvent(new GridEvent('movetile', this, null, tile, oldX, oldY));
    }

    getTile(x : number, y : number) : Tile | null {
        if (!this.tileGrid[x]) return null;
        if (!this.tileGrid[x][y]) return null;
        return this.tileGrid[x][y];
    }

    getOrAddTile(x : number, y : number) : Tile | null {
        if (!this.tileGrid[x]) this.tileGrid[x] = [];
        if (this.tileGrid[x][y]) return this.tileGrid[x][y];
        const tile = new this.gridType.createTile(this, x, y);
        this.addTile(tile);
        return tile;
    }

    getTriangleNeighbors(triangle : Triangle, includeNull? : boolean) : Triangle[] {
        const neighbors : Triangle[] = [];
        for (const n of triangle.neighborOffsets) {
            const neighbor = this.getTriangle(triangle.x + n[0], triangle.y + n[1]);
            if (neighbor || includeNull) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    getOrAddTriangleNeighbors(triangle : Triangle) : Triangle[] {
        return triangle.neighborOffsets.map((n) =>
            this.getOrAddTriangle(triangle.x + n[0], triangle.y + n[1]));
    }

    getTileNeighbors(tile : Tile) : Tile[] {
        const neighbors : Tile[] = [];
        for (const n of tile.neighborOffsets) {
            const neighbor = this.getTile(tile.x + n[0], tile.y + n[1]);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    getOrAddTileNeighbors(tile : Tile) : Tile[] {
        const neighbors : Tile[] = [];
        for (const n of tile.neighborOffsets) {
            const neighbor = this.getOrAddTile(tile.x + n[0], tile.y + n[1]);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    updateFrontier() {
        for (const t of this.tiles) {
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
        for (const triangle of this.triangles) {
            triangle.color = 'white';
            triangle.color = ['#aaa', '#888', '#ccc'][i % 3];
            i++;
        }
    }

    private createRandomTiles() {
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
    }
}
