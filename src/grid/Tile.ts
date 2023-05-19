import { Triangle } from './Triangle.js';
import { makeConvexHull } from '../lib/convex-hull.js';
import { Grid, TileColors, Coord } from './Grid.js';


export type TileType = new (grid : Grid, x : number, y : number) => Tile;

export abstract class Tile {
    grid: Grid;
    x: number;
    y: number;
    left: number;
    top: number;
    width: number;
    height: number;
    triangles: Triangle[];

    neighborOffsets: Coord[];

    constructor(grid: Grid, x: number, y: number) {
        this.grid = grid;
        this.x = x;
        this.y = y;

        this.triangles = this.findTriangles();

        this.left = Math.min(...this.triangles.map((t) => t.left));
        this.top = Math.min(...this.triangles.map((t) => t.top));
        this.width = Math.max(...this.triangles.map((t) => t.left + t.width)) - this.left;
        this.height = Math.max(...this.triangles.map((t) => t.top + t.height)) - this.top;
    }

    abstract findTriangles() : Triangle[];

    get colors(): TileColors {
        return this.triangles.map((t) => t.color);
    }

    set colors(colors: TileColors) {
        for (let i = 0; i < this.triangles.length; i++) {
            this.triangles[i].color = colors ? colors[i] : null;
        }
    }

    computeOutline() {
        const points: Coord[] = [];
        for (const triangle of this.triangles) {
            for (const point of triangle.points) {
                points.push([point[0] + triangle.left - this.left,
                point[1] + triangle.top - this.top]);
            }
        }
        return makeConvexHull(points);
    }
}
