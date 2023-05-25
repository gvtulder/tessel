import { ColorGroup, Coord, CoordId, Edge, TileColors, Triangle, TriangleColor } from './Triangle.js';
import { makeConvexHull } from '../lib/convex-hull.js';
import { Grid } from './Grid.js';
import { computeOutline } from 'src/lib/compute-outline.js';
import { wrapModulo } from 'src/utils.js';


export type TileRotation = {
    readonly angle : number;
    readonly steps : number;
}

type TriangleColorGroup = Coord[];
export type TileShape = TriangleColorGroup[];

export type TileVariant = {
    rotation: TileRotation,
    shape: TileShape,
};

export class TileEvent extends Event {
    tile : Tile;
    constructor(type : string, tile : Tile) {
        super(type);
        this.tile = tile;
    }
}

export class Tile extends EventTarget {
    static events = {
        UpdateTriangles: 'updatetriangles',
    };

    grid: Grid;
    x: number;
    y: number;
    coord: Coord;
    coordId: CoordId;
    left: number;
    top: number;
    width: number;
    height: number;
    rotations: TileRotation[];
    private _triangles: Map<Triangle, ColorGroup>;

    constructor(grid: Grid, x: number, y: number, triangles : Triangle[][]) {
        super();

        this.grid = grid;
        this.x = x;
        this.y = y;

        this.coord = [x, y];
        this.coordId = CoordId(x, y);

        this._triangles = new Map<Triangle, number>();
        this.updateTriangles(triangles);
    }

    updateTriangles(newTriangles: readonly Triangle[][]) {
        const newSet = new Map<Triangle, ColorGroup>();
        for (let c=0; c<newTriangles.length; c++) {
            for (const triangle of newTriangles[c]) {
                newSet.set(triangle, c);
            }
        }
        const del : Triangle[] = [];
        for (const triangle of this._triangles.keys()) {
            if (!newSet.has(triangle)) del.push(triangle);
        }
        for (const triangle of del) {
            this._triangles.delete(triangle);
            triangle.tile = null;
            triangle.colorGroup = null;
        }
        for (const [triangle, colorGroup] of newSet) {
            this._triangles.set(triangle, colorGroup);
            triangle.tile = this;
            triangle.colorGroup = colorGroup;
        }

        this.recomputeShapeParameters();

        this.dispatchEvent(new TileEvent(Tile.events.UpdateTriangles, this));
    }

    removeFromGrid() {
        this.updateTriangles([]);
    }

    private recomputeShapeParameters() {
        this.left = Math.min(...this.triangles.map((t) => t.left));
        this.top = Math.min(...this.triangles.map((t) => t.top));
        this.width = Math.max(...this.triangles.map((t) => t.left + t.width)) - this.left;
        this.height = Math.max(...this.triangles.map((t) => t.top + t.height)) - this.top;

        // TODO optimize -> precompute
        const tileVariants = this.computeRotationVariants();
        this.rotations = tileVariants.map((v) => v.rotation);
    }

    get triangles() : readonly Triangle[] {
        return [...this._triangles.keys()];
    }

    /**
     * @returns the triangles immediately next to this tile
     */
    getNeighborTriangles() : Triangle[] {
        const triangles = new Set<Triangle>();
        for (const triangle of this._triangles.keys()) {
            for (const neighbor of triangle.getOrAddNeighbors()) {
                triangles.add(neighbor)
            }
        }
        for (const triangle of this.triangles) {
            triangles.delete(triangle);
        }
        return [...triangles];
    }

    /**
     * Matches the triangles from this tile to the other.
     * 
     * @param other the other tile
     * @param otherRotation the rotation step of the other tile
     * @param otherTriangle anchor in the other tile
     * @param thisTriangle anchor in this tile
     * @returns map of this -> other triangles, or null if the mapping failed
     */
    matchShape(other : Tile, otherRotation : number, otherTriangle : Triangle,
               thisTriangle : Triangle) : Map<Triangle, Triangle> {
        if (other._triangles.size !== this._triangles.size) return null;

        // rotate the other shape
        const otherEdgeFrom = otherTriangle.getOrAddRotationEdge(0);
        const otherEdgeTo = otherTriangle.getOrAddRotationEdge(otherRotation);
        const otherPairsRotated = other.computeRotatedTrianglePairs(otherEdgeFrom, otherEdgeTo);

        // find the offset for the otherTriangle
        const rotatedOtherTriangle = otherPairsRotated.get(otherTriangle);
        const shift = [
            thisTriangle.x - rotatedOtherTriangle.x,
            thisTriangle.y - rotatedOtherTriangle.y,
        ] as Coord;

        // shift coordinates to match the triangles of this shape
        const thisCoordToOtherTriangles = new Map<CoordId, Triangle>();
        for (const [from, to] of otherPairsRotated) {
            const newTo = to.grid.getOrAddTriangle(
                to.x + shift[0],
                to.y + shift[1]
            );
            if (from.shape != newTo.shape) return null;
            thisCoordToOtherTriangles.set(newTo.coordId, from);
        }

        // compare coordinates with ours and pair
        const mapColorGroups = new Map<ColorGroup, ColorGroup>();
        const pairs = new Map<Triangle, Triangle>();
        for (const triangle of this.triangles) {
            const otherTriangle = thisCoordToOtherTriangles.get(triangle.coordId);

            // check if there is a triangle in the other shape for this coordinate
            if (!otherTriangle) return null;
            if (triangle.shape != otherTriangle.shape) return null;

            // check if the color groups match
            let expectColorGroup = mapColorGroups.get(triangle.colorGroup);
            if (expectColorGroup === null) {
                expectColorGroup = otherTriangle.colorGroup;
                mapColorGroups.set(triangle.colorGroup, expectColorGroup);
            }
            if (expectColorGroup != otherTriangle.colorGroup) return null;

            // pair checked and OK
            pairs.set(triangle, otherTriangle);
        }

        return pairs;
    }

    /**
     * Shifts the triangles if this results in a valid shape.
     * 
     * @param triangles input triangles
     * @param shift the shift to apply
     * @returns (original -> new) triangle map, or null if the shift is invalid
     */
    shiftToMatch(triangles : Triangle[], shift : Coord) : Map<Triangle, Triangle> {
        const map = new Map<Triangle, Triangle>();
        for (const triangle of triangles) {
            const newTriangle = triangle.grid.getOrAddTriangle(
                triangle.x + shift[0],
                triangle.y + shift[1]
            );
            if (triangle.shape != newTriangle.shape) return null;
            map.set(triangle, newTriangle);
        }
        return map;
    }

    /**
     * @returns true if the tile is a placeholder
     */
    isPlaceholder() {
        return this.triangles[0].color == null;
    }

    /**
     * @returns outline coordinates around the tile
     */
    computeOutline() : Coord[] {
        const r = computeOutline(new Set<Triangle>(this.triangles));
        return r.boundary.map((v) => [v.x - this.left, v.y - this.top]);
    }

    /**
     * Computes the offsets if the tile is rotated.
     * Maps starting from edgeFrom to edgeTo.
     * 
     * @param edgeFrom source rotation edge
     * @param edgeTo target rotation edge
     * @returns map of source to target triangles
     */
    computeRotatedTrianglePairs(edgeFrom : Edge, edgeTo : Edge) : Map<Triangle, Triangle> {
        const map = new Map<Triangle, Triangle>();
        const todo = new Set<Triangle>(this._triangles.keys());
        map.set(edgeFrom.from, edgeTo.from);
        map.set(edgeFrom.to, edgeTo.to);
        // console.log(edgeFrom, edgeTo);
        const queue : [Edge, Edge][] = [[edgeFrom, edgeTo]];
        while (queue.length > 0) {
            const [edgeFrom, edgeTo] = queue.pop();
            const sourceNeighbors = edgeFrom.to.getNeighbors(true, false);
            const targetNeighbors = edgeTo.to.getOrAddNeighbors();
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
        return map;
    }

    /**
     * Computes the unique rotation variants of this tile, taking into account
     * the shape and color groups.
     * 
     * @returns a list of unique rotation variants
     */
    computeRotationVariants() : TileVariant[] {
        const originTriangle = this.triangles[0];
        const rotationAngles = originTriangle.rotationAngles;
        const variants : TileVariant[] = [];
        const edgeFrom = originTriangle.getOrAddRotationEdge(0);

        // try every possible rotation for this grid type
        for (let r=0; r<rotationAngles.length; r++) {
            // apply rotation
            const edgeTo = originTriangle.getOrAddRotationEdge(r);
            const rotationMap = this.computeRotatedTrianglePairs(edgeFrom, edgeTo);

            // normalize the coordinates by moving the shape
            const shiftMap = this.computeShiftToOrigin([...rotationMap.values()]);

            // collect the offsets per color group
            const shape : TileShape = [];
            for (const triangle of this.triangles) {
                if (!shape[triangle.colorGroup]) shape[triangle.colorGroup] = [];
                shape[triangle.colorGroup].push(
                    shiftMap.get(rotationMap.get(triangle)).coord);
            }

            // construct the normalized variant
            const newVariant : TileVariant = {
                rotation: {
                    steps: r,
                    angle: rotationAngles[r]
                },
                shape: shape,
            };

            // unique shape?
            const unique = variants.every((variant) => !this.isEquivalentShape(variant, newVariant));
            if (unique) {
                variants.push(newVariant);
            }
        }
        return variants;
    }

    /**
     * Normalizes the triangle set by shifting the top-left triangle to (0, 0).
     * (Or as close as possible as the grid type allows.)
     * 
     * @param triangles the input triangles
     * @returns map of input -> normalized triangles
     */
    computeShiftToOrigin(triangles : Triangle[]) : Map<Triangle, Triangle> {
        let topLeft = triangles[0];
        for (const t of triangles) {
            // select a standard, repeatable origin
            const cmpAtOrigin = (t.xAtOrigin - topLeft.xAtOrigin) || (t.yAtOrigin - topLeft.yAtOrigin);
            const cmpAbsolute = (t.x - topLeft.x) || (t.y - topLeft.y)
            if ((cmpAtOrigin || cmpAbsolute) < 0) {
                topLeft = t;
            }
        }
        const shift = [
            topLeft.xAtOrigin - topLeft.x,
            topLeft.yAtOrigin - topLeft.y,
        ];
        return new Map<Triangle, Triangle>(
            triangles.map((from) => [
                from,
                from.grid.getOrAddTriangle(
                    from.x + shift[0],
                    from.y + shift[1]
                )
            ])
        );
    }

    /**
     * Compares two rotations for shape and color groups.
     * 
     * @param a tile variant A
     * @param b tile variant B
     * @returns true if the variants have matching shape and color groups
     */
    isEquivalentShape(a : TileVariant, b : TileVariant) {
        // assumption: normalized shapes, moved to origin

        // must have same number of color groups
        if (a.shape.length != b.shape.length) return false;

        // must have the same points in the same color groups,
        // but the color groups could be numbered differently
        const coordColorInA = new Map<CoordId, ColorGroup>();
        const colorAtoB = new Map<ColorGroup, ColorGroup>();
        let triangleCountA = 0;
        for (let c=0; c<a.shape.length; c++) {
            for (const offset of a.shape[c]) {
                coordColorInA.set(CoordId(offset), c);
                triangleCountA++;
            }
        }

        // compare with color groups in B
        let triangleCountB = 0;
        for (let c=0; c<b.shape.length; c++) {
            for (const offset of b.shape[c]) {
                // look up color of this triangle in A
                const colorInA = coordColorInA.get(CoordId(offset));
                // triangle must exist in A
                if (colorInA === null) return false;
                // check if it is the correct color group
                let colorInB = colorAtoB.get(colorInA);
                if (colorInB === null) {
                    // new color group in B
                    colorAtoB.set(colorInA, c);
                    colorInB = c;
                }
                if (colorInB != c) return false;
                triangleCountB++;
            }
        }

        return triangleCountA == triangleCountB;
    }
}
