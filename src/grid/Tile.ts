import { Triangle } from './Triangle.js';
import { makeConvexHull } from '../lib/convex-hull.js';
import { Grid, TileColors, Coord } from './Grid.js';


export type TileType = new (grid : Grid, x : number, y : number) => Tile;

export type OrientedColors = {
    shape : string;
    rotation : number;
    colors : TileColors;
}

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
        for (const triangle of this.triangles) {
            triangle.tile = this;
        }

        this.left = Math.min(...this.triangles.map((t) => t.left));
        this.top = Math.min(...this.triangles.map((t) => t.top));
        this.width = Math.max(...this.triangles.map((t) => t.left + t.width)) - this.left;
        this.height = Math.max(...this.triangles.map((t) => t.top + t.height)) - this.top;
    }

    abstract get rotationAngles() : number[];
    abstract findTriangles() : Triangle[];

    protected mapColorsToTriangles(colors : TileColors) : TileColors {
        return colors;
    }
    protected mapColorsFromTriangles(colors : TileColors) : TileColors {
        return colors;
    }

    get orientation() : string {
        return 'default';
    }

    get colors(): TileColors {
        return this.mapColorsFromTriangles(this.triangles.map((t) => t.color));
    }

    set colors(colors: TileColors) {
        colors = this.mapColorsToTriangles(colors);
        for (let i = 0; i < this.triangles.length; i++) {
            this.triangles[i].color = colors ? colors[i] : null;
        }
    }

    setOrientedColors(orientedColors : OrientedColors) {
        this.colors = this.computeFromOrientedColors(orientedColors);
    }

    getOrientedColors(rotation : number) : OrientedColors {
        // simple rotations
        return {
            shape: 'default',
            rotation: rotation,
            colors: this.colors,
        };
    }

    checkFitOrientedColors(orientedColors : OrientedColors) : boolean {
        let colors = this.computeFromOrientedColors(orientedColors);
        colors = this.mapColorsToTriangles(colors);
        for (let i=0; i<this.triangles.length; i++) {
            const triangle = this.triangles[i];
            const neighbors = this.grid.getTriangleNeighbors(triangle);
            for (const neighbor of neighbors) {
                if (neighbor.color != null && neighbor.color != colors[i]) {
                    return false;
                }
            }
        }
        return true;
    }

    checkFitOrientedColorsWithRotation(orientedColors : OrientedColors) : OrientedColors {
        const currentRotation = orientedColors.rotation;
        for (let r=0; r<this.rotationAngles.length; r++) {
            const o = {
                shape: orientedColors.shape,
                colors: orientedColors.colors,
                rotation: (currentRotation + r) % this.rotationAngles.length,
            };
            if (this.checkFitOrientedColors(o)) {
                return o;
            }
        }
        return null;
    }

    computeFromOrientedColors(orientedColors : OrientedColors) : TileColors {
        // simple rotations
        // TODO remove for loop?
        let colors = orientedColors.colors;
        for (let i=0; i<orientedColors.rotation; i++) {
            colors = [colors[colors.length - 1], ...colors.slice(0, -1)];
        }
        return colors;
    }

    isPlaceholder() {
        return this.triangles[0].color == null;
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
