import { TriangleColor, Coord } from './Grid.js';
import { Tile } from './Tile.js';

export type TriangleType = (new (x : number, y : number) => Triangle);

export type Edge = { from: Triangle, to: Triangle };
export type CoordEdge = { from: Coord, to: Coord };

export abstract class Triangle extends EventTarget {
    x: number;
    y: number;
    shape: number;
    rotationShape: number;
    xAtOrigin: number;
    yAtOrigin: number;
    private _color: TriangleColor;
    tile? : Tile;

    points: [Coord, Coord, Coord];
    polyPoints: Coord[];
    left: number;
    top: number;

    // neighbors in clockwise order,
    // starting with the current triangle rotated to the right
    neighborOffsets: Coord[];

    // rotation in clockwise order
    rotationOffsets: CoordEdge[];
    rotationAngles: number[];

    private _changecolor: Event = new Event('changecolor');

    constructor(x: number, y: number) {
        super();

        this.x = x;
        this.y = y;
        this.color = null;

        this.calc();
    }

    abstract calc();

    get center(): Coord {
        // incenter coordinates
        const sideLength = (a: Coord, b: Coord) => (
            Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
        );
        const w0 = sideLength(this.points[1], this.points[2]), w1 = sideLength(this.points[0], this.points[2]), w2 = sideLength(this.points[0], this.points[1]);
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
}
