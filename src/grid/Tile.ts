import { computeOutline } from 'src/lib/compute-outline.js';
import { shiftCoordinates2, wrapModulo } from 'src/utils.js';
import { Grid } from './Grid.js';
import { ColorGroup, Coord, CoordId, Edge, TileColors, Triangle } from './Triangle.js';


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
        UpdateColors: 'updatecolors',
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
    protected _triangles: Map<Triangle, ColorGroup>;
    protected _colors: TileColors;

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

    /**
     * Replace the triangles of this tile.
     *
     * @param newTriangles new set of triangles
     */
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

        this.recomputeColorGroups();
        this.recomputeShapeParameters();

        this.dispatchEvent(new TileEvent(Tile.events.UpdateTriangles, this));
    }

    /**
     * Remove this tile from the grid (called by Grid).
     */
    removeFromGrid() {
        this.updateTriangles([]);
    }

    /**
     * Add a pre-checked triangle to the shape.
     * @param triangle the new triangle
     */
    protected doAddTriangle(triangle : Triangle) {
        // add the triangle
        this._triangles.set(triangle, triangle.colorGroup);
        triangle.tile = this;
        this.recomputeColorGroups();
        this.recomputeShapeParameters();
        this.dispatchEvent(new TileEvent(Tile.events.UpdateTriangles, this));
    }

    /**
     * Remove a pre-checked triangle to the shape.
     * @param triangle the triangle to be removed
     */
    protected doRemoveTriangle(triangle : Triangle) {
        // remove the triangle
        this._triangles.delete(triangle);
        triangle.tile = null;
        triangle.colorGroup = null;
        triangle.color = null;
        this.recomputeColorGroups();
        this.recomputeShapeParameters();
        this.dispatchEvent(new TileEvent(Tile.events.UpdateTriangles, this));
    }

    /**
     * Recompute and renumber the color groups if necessary.
     */
    protected recomputeColorGroups() {
        // find the number of unique color groups
        const colorGroups = new Set<ColorGroup>(this._triangles.values());
        const remappedColorGroups = new Map<ColorGroup, ColorGroup>();

        // renumber
        const sortedColorGroups = [...colorGroups];
        sortedColorGroups.sort();
        for (let c=0; c<sortedColorGroups.length; c++) {
            remappedColorGroups.set(sortedColorGroups[c], c);
        }

        // remap colors
        const oldColors = this._colors;
        const newColors = sortedColorGroups.map((c) => oldColors ? oldColors[c] : null);
        this._colors = newColors;

        // update triangles
        for (const triangle of this._triangles.keys()) {
            const newColorGroup = remappedColorGroups.get(triangle.colorGroup);
            this._triangles.set(triangle, newColorGroup);
            triangle.colorGroup = newColorGroup;
        }
    }

    protected recomputeShapeParameters() {
        this.left = Math.min(...this.triangles.map((t) => t.left));
        this.top = Math.min(...this.triangles.map((t) => t.top));
        this.width = Math.max(...this.triangles.map((t) => t.left + t.width)) - this.left;
        this.height = Math.max(...this.triangles.map((t) => t.top + t.height)) - this.top;

        // TODO optimize -> precompute
        const tileVariants = this.computeRotationVariants(true);
        this.rotations = tileVariants.map((v) => v.rotation);
    }

    /**
     * Update the colors of this tile.
     */
    set colors(colors : TileColors) {
        this._colors = colors;
        for (const [triangle, colorGroup] of this._triangles) {
            triangle.color = colors ? colors[colorGroup] : null;
        }
        this.dispatchEvent(new TileEvent(Tile.events.UpdateColors, this));
    }

    /**
     * Return the colors of this tile.
     */
    get colors() : TileColors | null {
        return this._colors ? [...this._colors] : null;
    }

    /**
     * Returns true if these colors would fit.
     */
    checkFitColors(colors : TileColors) {
        for (const [triangle, colorGroup] of this._triangles) {
            const mismatch = triangle.getNeighbors().some((neighbor) => (
                neighbor.tile !== this &&
                neighbor.tile &&
                !neighbor.tile.isPlaceholder() &&
                neighbor.color != colors[colorGroup]
            ));
            if (mismatch) return false;
        }
        return true;
    }

    /**
     * The triangles in this shape.
     */
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
     * Tries to rotate the other tile to fit in this location
     *
     * @param other the other tile
     * @returns the rotation to make it fit, or null if that is impossible
     */
    rotateToFit(other : Tile, currentRotation : TileRotation) : TileRotation {
        // TODO start with currentRotation
        for (let r=0; r<other.rotations.length; r++) {
            const match = this.matchShape(other, other.rotations[r]);
            if (match) {
                return other.rotations[r];
            }
        }
        return null;
    }

    /**
     * Matches the triangles from this tile to the other and computs the color list.
     *
     * @param other the other tile
     * @param otherRotation the rotation step of the other tile
     * @param otherTriangle anchor in the other tile
     * @param thisTriangle anchor in this tile
     * @returns list of colors for this tile, or null if the mapping failed
     */
    matchShapeMapColors(other : Tile, otherRotation : TileRotation, otherTriangle : Triangle,
                        thisTriangle : Triangle) : TileColors {
        const match = this.matchShape(other, otherRotation, otherTriangle, thisTriangle);
        if (!match) return null;

        // map colors to the target tile
        return this.colors.map(
            (c, idx) => other.colors[match.colorGroups.get(idx)]
        );
    }

    /**
     * Matches the triangles from this tile to the other.
     * 
     * @param other the other tile
     * @param otherRotation the rotation step of the other tile
     * @param otherTriangle anchor in the other tile
     * @param thisTriangle anchor in this tile
     * @returns map of this -> other triangles and color groups, or null if the mapping failed
     */
    matchShape(other : Tile, otherRotation : TileRotation,
               otherTriangle? : Triangle, thisTriangle? : Triangle) :
               { triangles: Map<Triangle, Triangle>, colorGroups: Map<ColorGroup, ColorGroup> } {
        if (other._triangles.size !== this._triangles.size) return null;

        // rotate the other shape
        const otherEdgeFrom = otherTriangle.getOrAddRotationEdge(0);
        const otherEdgeTo = otherTriangle.getOrAddRotationEdge(otherRotation.steps);
        const otherPairsRotated = other.computeRotatedTrianglePairs(otherEdgeFrom, otherEdgeTo);

        if (otherTriangle === undefined) {
            // find an anchor point
            const shiftMapThis = this.mapTrianglesToOrigin([...otherPairsRotated.values()]);
            const shiftMapOther = other.mapTrianglesToOrigin([...otherPairsRotated.values()]);

        }

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
            if (to.shape != newTo.shape) return null;
            thisCoordToOtherTriangles.set(newTo.coordId, from);
        }

        // compare coordinates with ours and pair
        const mapColorGroups = new Map<ColorGroup, ColorGroup>();
        const pairs = new Map<Triangle, Triangle>();
        for (const triangle of this.triangles) {
            const otherTriangle = thisCoordToOtherTriangles.get(triangle.coordId);

            // check if there is a triangle in the other shape for this coordinate
            if (!otherTriangle) return null;

            // check if the color groups match
            let expectColorGroup = mapColorGroups.get(triangle.colorGroup);
            if (expectColorGroup === null || expectColorGroup === undefined) {
                expectColorGroup = otherTriangle.colorGroup;
                mapColorGroups.set(triangle.colorGroup, expectColorGroup);
            }
            if (expectColorGroup != otherTriangle.colorGroup) return null;

            // pair checked and OK
            pairs.set(triangle, otherTriangle);
        }

        return { triangles: pairs, colorGroups: mapColorGroups };
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
        return this._colors === null || (this._colors && this._colors[0] === null);
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
        // only return the triangles of this tile
        const result = new Map<Triangle, Triangle>();
        for (const triangle of this._triangles.keys()) {
            result.set(triangle, map.get(triangle));
        }
        return result;
    }

    /**
     * Computes the unique rotation variants of this tile, taking into account
     * the shape and color groups.
     * 
     * @param colorSensitive the color groups should match exactly
     * @returns a list of unique rotation variants
     */
    computeRotationVariants(colorSensitive? : boolean) : TileVariant[] {
        const originTriangle = this.triangles[0];
        const rotationAngles = originTriangle.rotationAngles;
        const variants : TileVariant[] = [];
        const edgeFrom = originTriangle.getOrAddRotationEdge(0);

        let shapesInPattern : TileShape[] = null;
        if (this.grid.pattern) {
            shapesInPattern = this.grid.pattern.shapes.map(
                (shape) => this.moveToOrigin(shape)
            );
        }

        // try every possible rotation for this grid type
        for (let r=0; r<rotationAngles.length; r++) {
            // apply rotation
            const edgeTo = originTriangle.getOrAddRotationEdge(r);
            const rotationMap = this.computeRotatedTrianglePairs(edgeFrom, edgeTo);

            // normalize the coordinates by moving the shape
            const shiftMap = this.mapTrianglesToOrigin([...rotationMap.values()]);

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

            // does this exist in the pattern?
            const existsInPattern = !shapesInPattern || shapesInPattern.some(
                (shapeInPattern) => this.isEquivalentShape(shapeInPattern, newVariant.shape)
            );
            if (!existsInPattern) continue;

            // unique shape?
            const unique = variants.every(
                (variant) => !this.isEquivalentShape(variant.shape, newVariant.shape, colorSensitive)
            );
            if (unique) {
                variants.push(newVariant);
            }
        }
        return variants;
    }

    /**
     * Normalizes the shape offsets by shifting the top-left triangle to (0, 0).
     * (Or as close as possible as the grid type allows.)
     *
     * @param shape the input shape
     * @returns the normalized shape
     */
    moveToOrigin(shape: TileShape) : TileShape {
        const triangles = this.grid.shapeToTriangles(shape);
        const shift = this.computeShiftToOrigin(triangles);
        return shiftCoordinates2(shape, shift);
    }

    /**
     * Normalizes the triangle set by shifting the top-left triangle to (0, 0).
     * (Or as close as possible as the grid type allows.)
     * 
     * @param triangles the input triangles
     * @returns map of input -> normalized triangles
     */
    mapTrianglesToOrigin(triangles : Triangle[]) : Map<Triangle, Triangle> {
        const shift = this.computeShiftToOrigin(triangles);
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
     * Computes the shift that normalizes the triangle set by moving
     * the top-left triangle to (0, 0).
     * (Or as close as possible as the grid type allows.)
     *
     * @param triangles the input triangles
     * @returns the offset
     */
    computeShiftToOrigin(triangles : Triangle[]) : Coord {
        let topLeft = triangles[0];
        for (const t of triangles) {
            // select a standard, repeatable origin
            const cmpAtOrigin = (t.xAtOrigin - topLeft.xAtOrigin) || (t.yAtOrigin - topLeft.yAtOrigin);
            const cmpAbsolute = (t.x - topLeft.x) || (t.y - topLeft.y);
            if ((cmpAtOrigin || cmpAbsolute) < 0) {
                topLeft = t;
            }
        }
        return [
            topLeft.xAtOrigin - topLeft.x,
            topLeft.yAtOrigin - topLeft.y,
        ];
    }

    /**
     * Compares two rotations for shape and color groups.
     * 
     * @param a tile variant A
     * @param b tile variant B
     * @param colorSensitive color groups should match
     * @returns true if the variants have matching shape and color groups
     */
    isEquivalentShape(a : TileShape, b : TileShape, colorSensitive? : boolean) {
        // assumption: normalized shapes, moved to origin

        // must have same number of color groups
        if (a.length != b.length) return false;

        // must have the same points in the same color groups,
        // but the color groups could be numbered differently
        const coordColorInA = new Map<CoordId, ColorGroup>();
        const colorAtoB = new Map<ColorGroup, ColorGroup>();
        let triangleCountA = 0;
        for (let c=0; c<a.length; c++) {
            for (const offset of a[c]) {
                coordColorInA.set(CoordId(offset), c);
                triangleCountA++;
            }
        }

        // should the color groups be in the same order?
        if (colorSensitive) {
            for (const colorGroup of coordColorInA.values()) {
                colorAtoB.set(colorGroup, colorGroup);
            }
        }

        // compare with color groups in B
        let triangleCountB = 0;
        for (let c=0; c<b.length; c++) {
            for (const offset of b[c]) {
                // look up color of this triangle in A
                const colorInA = coordColorInA.get(CoordId(offset));
                // triangle must exist in A
                if (colorInA === null || colorInA === undefined) return false;
                // check if it is the correct color group
                let colorInB = colorAtoB.get(colorInA);
                if (colorInB === null || colorInB === undefined) {
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
