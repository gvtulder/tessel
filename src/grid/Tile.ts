import { Edge, Triangle } from './Triangle.js';
import { makeConvexHull } from '../lib/convex-hull.js';
import { Grid, TileColors, Coord, TriangleColor } from './Grid.js';
import { computeOutline } from 'src/lib/compute-outline.js';
import { wrapModulo } from 'src/utils.js';


export type TileType = new (grid : Grid, x : number, y : number) => Tile;

export type OrientedColors = {
    shape : string;
    rotation : number;
    colors : TileColors;
}

export abstract class Tile extends EventTarget {
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
        super();

        this.grid = grid;
        this.x = x;
        this.y = y;

        this.updateTriangles();
    }

    abstract get rotationAngles() : number[];
    abstract findTriangles() : Triangle[];

    protected updateTriangles() {
        const oldTriangles = new Set<Triangle>(this.triangles || []);
        this.triangles = this.findTriangles();
        for (const triangle of this.triangles) {
            triangle.tile = this;
            oldTriangles.delete(triangle);
        }
        for (const triangle of oldTriangles.values()) {
            triangle.tile = null;
        }
        this.left = Math.min(...this.triangles.map((t) => t.left));
        this.top = Math.min(...this.triangles.map((t) => t.top));
        this.width = Math.max(...this.triangles.map((t) => t.left + t.width)) - this.left;
        this.height = Math.max(...this.triangles.map((t) => t.top + t.height)) - this.top;

        this.dispatchEvent(new Event('updatetriangles'));
    }

    removeFromGrid() {
        for (const triangle of this.triangles) {
            triangle.tile = null;
        }
    }

    protected mapColorsToTriangles(colors : TileColors | TriangleColor) : TileColors {
        if (!colors || typeof colors === 'string') {
            return this.triangles.map(() => colors as string);
        }
        return colors;
    }
    protected mapColorsFromTriangles(colors : TileColors) : TileColors {
        return colors;
    }

    get shape() : string {
        return 'default';
    }

    get colors(): TileColors {
        return this.mapColorsFromTriangles(this.triangles.map((t) => t.color));
    }

    set colors(colors: TileColors | TriangleColor) {
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
        if (colors === null) return false;
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
        const r = computeOutline(new Set<Triangle>(this.triangles));
        return r.boundary.map((v) => [v.x - this.left, v.y - this.top]);
    }


    computeRotatedOffsets(targetGrid : Grid, edgeFrom : Edge, edgeTo : Edge) : Coord[] {
        const map = new Map<Triangle, Triangle>();
        const todo = new Set<Triangle>(this.triangles);
        map.set(edgeFrom.from, edgeTo.from);
        map.set(edgeFrom.to, edgeTo.to);
        // console.log(edgeFrom, edgeTo);
        const queue : [Edge, Edge][] = [[edgeFrom, edgeTo]];
        while (queue.length > 0) {
            const [edgeFrom, edgeTo] = queue.pop();
            const sourceNeighbors = this.grid.getTriangleNeighbors(edgeFrom.to, true);
            const targetNeighbors = targetGrid.getOrAddTriangleNeighbors(edgeTo.to);
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

        // console.log(map);

        return this.triangles.map((src) => {
            const tgt = map.get(src);
            return [tgt.x, tgt.y];
        });
    }
}
