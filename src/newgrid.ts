
import { EquilateralGridTriangle } from './grid/EquilateralGridTriangle.js';
import { HexGridTriangle } from './grid/HexGridTriangle.js';
import { HexTile } from './grid/HexTile.js';
import { SquareGridTriangle } from './grid/SquareGridTriangle.js';
import { SquareTile } from './grid/SquareTile.js';
import { Tile } from './grid/Tile.js';
import { TriangleTile } from './grid/TriangleTile.js';
import { Triangle } from './grid/Triangle.js';
import { GridDisplay } from './ui/GridDisplay.js';
import { DEBUG } from './settings.js';

const COLORS = ['black', 'red', 'blue', 'grey', 'green', 'brown', 'orange', 'purple', 'pink'];


export type TriangleColor = string;
export type TileColors = TriangleColor[];


export type Coord = [x : number, y : number];



export class GridEvent extends Event {
    grid : NewGrid;
    triangle? : Triangle;
    tile? : Tile;

    constructor(type : string, grid : NewGrid, triangle : Triangle, tile : Tile) {
        super(type);
        this.grid = grid;
        this.triangle = triangle;
        this.tile = tile;
    }
}


export class NewGrid extends EventTarget {
    triangleType = [HexGridTriangle, SquareGridTriangle, EquilateralGridTriangle][DEBUG.SELECT_GRID];

    grid : Triangle[][];
    triangles : Triangle[];
    tiles : Tile[];

    div : HTMLDivElement;
    gridDisplay : GridDisplay;

    constructor() {
        super();

        this.grid = [];
        this.triangles = [];
        this.tiles = [];

        const display = new GridDisplay(this);
        display.drawTriangles();
        document.body.appendChild(display.element);
        this.gridDisplay = display;

        if (DEBUG.RANDOM_TRIANGLES) {
            this.createRandomTriangles();
        }
        if (DEBUG.WHITE_TRIANGLES) {
            this.fillTrianglesWithWhite();
        }
        if (DEBUG.RANDOM_TILES) {
            this.createRandomTiles();
        }
        if (DEBUG.CONNECT_TILES) {
            display.debugConnectAllTriangles();
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
            const triangle = new this.triangleType(x, y);
            this.grid[x][y] = triangle;
            this.triangles.push(triangle);
            this.dispatchEvent(new GridEvent('addtriangle', this, triangle, null));
        }
        return this.grid[x][y];
    }

    addTile(tile : Tile) {
        this.tiles.push(tile);
        this.dispatchEvent(new GridEvent('addtile', this, null, tile));
    }

    getNeighbors(triangle : Triangle) : Triangle[] {
        const neighbors : Triangle[] = [];
        for (const n of triangle.neighborOffsets) {
            const neighbor = this.getTriangle(triangle.x + n[0], triangle.y + n[1]);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
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
        if (this.triangleType === SquareGridTriangle) {
            let i = 0;
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    const tile = new SquareTile(this, x, y);
                    const color = COLORS[i % COLORS.length];
                    tile.colors = [color, color, color, color];
                    this.addTile(tile);
                    i++;
                }
            }
        }

        if (this.triangleType === HexGridTriangle) {
            let i = 0;
            for (let x = 0; x < 2; x++) {
                for (let y = 0; y < 4; y++) {
                    const tile = new HexTile(this, x, y);
                    const color = COLORS[i % COLORS.length];
                    tile.colors = [color, 'white', color, color, color, color];
                    this.addTile(tile);
                    i++;
                }
            }
        }

        if (this.triangleType === EquilateralGridTriangle) {
            let i = 0;
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    const tile = new TriangleTile(this, x, y);
                    const color = COLORS[i % COLORS.length];
                    tile.colors = [color, color, color];
                    this.addTile(tile);
                    i++;
                }
            }
        }
    }
}
