import { dist, wrapModulo } from 'src/utils.js';
import { Grid } from './Grid.js';
import { Tile } from './Tile.js';

export type TriangleType = (new (grid : Grid, x : number, y : number) => Triangle);

export type CoordId = string;
export function CoordId(x : number, y : number) : CoordId;
export function CoordId(c : Coord) : CoordId;
export function CoordId(xOrCoord : number | Coord, y? : number) : CoordId {
    return (y === undefined) ?
           `${(xOrCoord as Coord)[0]} ${(xOrCoord as Coord)[1]}` :
           `${xOrCoord as number} ${y}`;
}

export type Coord = readonly [x : number, y : number];
export type CoordEdge = { readonly from: Coord, readonly to: Coord };
export type Edge = { readonly from: Triangle, readonly to: Triangle };

export type TriangleColor = string;
export type TileColors = readonly TriangleColor[];

export class TriangleEvent extends Event {
    triangle : Triangle;
    oldColor? : TriangleColor;
    newColor? : TriangleColor;
    oldTile? : Tile;
    newTile? : Tile;

    constructor(type : string, triangle : Triangle,
                oldColor? : TriangleColor, newColor? : TriangleColor,
                oldTile? : Tile, newTile? : Tile) {
        super(type);
        this.triangle = triangle;
        this.oldColor = oldColor;
        this.newColor = newColor;
        this.oldTile = oldTile;
        this.newTile = newTile;
    }
}

export abstract class Triangle extends EventTarget {
    static events = {
        ChangeColor: 'changecolor',
        ChangeTile: 'changetile',
    };

    grid: Grid;
    x: number;
    y: number;
    coord: Coord;
    coordId: CoordId;
    shape: number;
    rotationShape: number;
    xAtOrigin: number;
    yAtOrigin: number;
    private _color: TriangleColor;
    private _tile : Tile | null;

    points: readonly [Coord, Coord, Coord];
    polyPoints: ReadonlyArray<Coord>;
    left: number;
    top: number;

    // neighbors in clockwise order
    neighborOffsets: ReadonlyArray<Coord>;

    // rotation in clockwise order
    rotationOffsets: ReadonlyArray<CoordEdge>;
    rotationAngles: readonly number[];

    constructor(grid : Grid, x: number, y: number) {
        super();

        this.grid = grid;
        this.x = x;
        this.y = y;
        this._color = null;
        this._tile = null;

        this.coord = [x, y];
        this.coordId = CoordId(x, y);

        this.calc();
    }

    protected abstract calc();

    get center(): Coord {
        // incenter coordinates
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
        if (changed) {
            const old = color;
            this._color = color;
            this.dispatchEvent(new TriangleEvent(Triangle.events.ChangeColor, this, old, color, null, null));
        }
    }

    get color(): TriangleColor {
        return this._color;
    }

    set tile(tile: Tile | null) {
        const changed = this._tile !== tile;
        if (changed) {
            const old = this._tile;
            this._tile = tile;
            this.dispatchEvent(new TriangleEvent(Triangle.events.ChangeTile, this, null, null, old, tile));
        }
    }

    get tile(): Tile {
        return this._tile;
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
