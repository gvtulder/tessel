import { dist, wrapModulo } from 'src/utils.js';
import { Grid } from './Grid.js';
import { Tile } from './Tile.js';

export type TriangleType = (new (grid : Grid, x : number, y : number) => Triangle);

export type Coord = readonly [x : number, y : number];
export type CoordEdge = { readonly from: Coord, readonly to: Coord };
export type Edge = { readonly from: Triangle, readonly to: Triangle };

export type TriangleColor = string;
export type TileColors = readonly TriangleColor[];

export abstract class Triangle extends EventTarget {
    grid: Grid;
    x: number;
    y: number;
    coord: Coord;
    coordId: string;
    shape: number;
    rotationShape: number;
    xAtOrigin: number;
    yAtOrigin: number;
    private _color: TriangleColor;
    tile? : Tile;

    points: readonly [Coord, Coord, Coord];
    polyPoints: ReadonlyArray<Coord>;
    left: number;
    top: number;

    // neighbors in clockwise order
    neighborOffsets: ReadonlyArray<Coord>;

    // rotation in clockwise order
    rotationOffsets: ReadonlyArray<CoordEdge>;
    rotationAngles: readonly number[];

    private _changecolor: Event = new Event('changecolor');

    constructor(grid : Grid, x: number, y: number) {
        super();

        this.grid = grid;
        this.x = x;
        this.y = y;
        this.color = null;

        this.coord = [x, y];
        this.coordId = `${x} ${y}`;

        this.calc();
    }

    protected abstract calc();

    get center(): Coord {
        // incenter coordinates
        const sideLength = (a: Coord, b: Coord) => (
            Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
        );
        const w0 = dist(this.points[1], this.points[2]);
        const w1 = dist(this.points[0], this.points[2]);
        const w2 = dist(this.points[0], this.points[1]);
        const x = (w0 * this.points[0][0] + w1 * this.points[1][0] + w2 * this.points[2][0]) / (w0 + w1 + w2);
        const y = (w0 * this.points[0][1] + w1 * this.points[1][1] + w2 * this.points[2][1]) / (w0 + w1 + w2);
        return [x, y];
    }

    get width(): number {
        return Math.max(...this.points.map((p) => p[0]));
    }

    get height(): number {
        return Math.max(...this.points.map((p) => p[1]));
    }

    set color(color: TriangleColor) {
        const changed = this._color != color;
        this._color = color;
        if (changed) {
            this.dispatchEvent(this._changecolor);
        }
    }

    get color(): TriangleColor {
        return this._color;
    }

    getNeighbors(includeNull? : boolean, addMissing? : boolean) : Triangle[] {
        const neighbors : Triangle[] = [];
        for (const n of this.neighborOffsets) {
            const neighbor = this.grid.getTriangle(this.x + n[0], this.y + n[1], addMissing);
            if (neighbor || includeNull) {
                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    getOrAddNeighbors() : Triangle[] {
        return this.getNeighbors(true, true);
    }

    getRotationEdge(rotation : number, addMissing?: boolean) : Edge {
        const offset = this.rotationOffsets[wrapModulo(rotation, this.rotationOffsets.length)];
        return {
            from: this.grid.getTriangle(this.x + offset.from[0], this.y + offset.from[1], addMissing),
            to: this.grid.getTriangle(this.x + offset.to[0], this.y + offset.to[1], addMissing),
        };
    }

    getOrAddRotationEdge(rotation : number) : Edge {
        return this.getRotationEdge(rotation, true);
    }
}
