import { Edge, Triangle } from './Triangle.js';
import { makeConvexHull } from '../lib/convex-hull.js';
import { Grid, TileColors, Coord, TriangleColor } from './Grid.js';
import { computeOutline } from 'src/lib/compute-outline.js';
import { wrapModulo } from 'src/utils.js';
import { TileVariant } from './ProtoTile.js';


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

    matchShape(other : Tile, otherRotation : number, otherTriangle : Triangle, thisTriangle : Triangle) : [Triangle, Triangle][] {
        if (other.triangles.length !== this.triangles.length) return null;
        const trianglesSource = new Set<Triangle>(this.triangles);
        const trianglesTarget = new Set<Triangle>(other.triangles);
        const edgeSource = this.grid.getOrAddRotationEdge(thisTriangle, 0);
        let edgeTarget = other.grid.getOrAddRotationEdge(otherTriangle, -otherRotation);
        edgeTarget = { from: edgeTarget.to, to: edgeTarget.from };

        const map = new Map<Triangle, Triangle>();
        const queue : [Edge, Edge][] = [[edgeSource, edgeTarget]];
        while (queue.length > 0) {
            const [edgeSource, edgeTarget] = queue.pop();
            map.set(edgeSource.from, edgeTarget.from);
            const neighborsSource = this.grid.getTriangleNeighbors(edgeSource.from, true);
            const neighborsTarget = other.grid.getTriangleNeighbors(edgeTarget.from, true);
            const prevSrcIdx = neighborsSource.indexOf(edgeSource.to);
            const prevTgtIdx = neighborsTarget.indexOf(edgeTarget.to);
            for (let i=0; i<neighborsSource.length; i++) {
                const neighbor = neighborsSource[i];
                if (trianglesSource.has(neighbor) && !map.has(neighbor)) {
                    const newIdx = wrapModulo(i + prevTgtIdx - prevSrcIdx, neighborsSource.length);
                    const targetNeighbor = neighborsTarget[newIdx];
                    if (!trianglesTarget.has(targetNeighbor)) return null;
                    map.set(neighbor, targetNeighbor);
                    queue.push([
                        { from: neighbor, to: edgeSource.from },
                        { from: targetNeighbor, to: edgeTarget.from },
                    ]);
                }
            }
        }

        if (map.size != trianglesSource.size) return null;

        return [...map.entries()];
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

    computeOutline() : Coord[] {
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

    computeRotationVariants() : TileVariant[] {
        const originTriangle = this.triangles[0];
        const variants : TileVariant[] = [];
        const edgeFrom = this.grid.getOrAddRotationEdge(originTriangle, 0);
        for (let r=0; r<this.triangles[0].rotationAngles.length; r++) {
            const edgeTo = this.grid.getOrAddRotationEdge(originTriangle, r);
            let offsets = this.computeRotatedOffsets(this.grid, edgeFrom, edgeTo);
            offsets = this.moveOffsetsToOrigin(offsets);
            const newVariant = {
                rotation: r,
                rotationAngle: this.triangles[0].rotationAngles[r],
                offsets: offsets,
                colors: [...this.colors],
            };

            // unique shape?
            const unique = variants.every((variant) => !this.isEquivalentShape(variant, newVariant));
            if (unique) {
                variants.push({
                    rotation: r,
                    rotationAngle: this.triangles[0].rotationAngles[r],
                    offsets: offsets,
                    colors: [...this.colors],
                });
            }
        }
        return variants;
    }

    moveOffsetsToOrigin(offsets : Coord[]) : Coord[] {
        const triangles = offsets.map((o) => this.grid.getOrAddTriangle(o[0], o[1]));
        let topLeft = triangles[0];
        for (const t of triangles) {
            const cmpAtOrigin = (t.xAtOrigin - topLeft.xAtOrigin) || (t.yAtOrigin - topLeft.yAtOrigin);
            const cmpAbsolute = (t.x - topLeft.x) || (t.y - topLeft.y)
            if ((cmpAtOrigin || cmpAbsolute) < 0) {
                topLeft = t;
            }
        }
        return offsets.map((offset) => [
            offset[0] - topLeft.x + topLeft.xAtOrigin,
            offset[1] - topLeft.y + topLeft.yAtOrigin
        ]);
    }

    isEquivalentShape(a : TileVariant, b : TileVariant) {
        // assumption: offsets moved to origin
        if (a.offsets.length != b.offsets.length) return false;
        const colorsInA = new Map<string, string>();
        const colorAtoB = new Map<string, string>();
        for (let i=0; i<a.offsets.length; i++) {
            colorsInA.set(`${a.offsets[i][0]} ${a.offsets[i][1]}`, a.colors[i]);
        }
        for (let i=0; i<b.offsets.length; i++) {
            const colorInA = colorsInA.get(`${b.offsets[i][0]} ${b.offsets[i][1]}`);
            if (!colorInA) return false;
            const colorInB = colorAtoB.get(colorInA);
            if (!colorInB) colorAtoB.set(colorInA, b.colors[i]);
            if (colorInB && colorInB != b.colors[i]) return false;
        }
        return true;
    }
}
