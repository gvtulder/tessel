import { computeOutline } from 'src/lib/compute-outline.js';
import { angleDist, shiftCoordinates2, wrapModulo } from 'src/utils.js';
import { Grid } from './Grid.js';
import { ColorGroup, Coord, CoordId, Edge, TileColors, Triangle } from './Triangle.js';


export type TileRotation = {
    readonly angle : number;
    readonly steps : number;
}

type TriangleColorGroup = Coord[];
export type TileShape = TriangleColorGroup[];

export enum TileType {
    NormalTile,
    Placeholder,
    TileOnStack,
    EditableTile,
    PatternEditorTile,
    PatternExample,
    MenuExampleTile,
}

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

export class Tile {
    static events = {
        UpdateTriangles: 'updatetriangles',
        UpdateColors: 'updatecolors',
    };

    type : TileType;
    grid: Grid;
    x: number;
    y: number;
    coord: Coord;
    coordId: CoordId;
    left: number;
    top: number;
    width: number;
    height: number;
    protected _rotations: TileRotation[];
    protected _triangles: Map<Triangle, ColorGroup>;
    protected _colors: TileColors;

    constructor(grid: Grid, x: number, y: number, type : TileType, triangles : Triangle[][]) {
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.type = type;

        this.coord = [x, y];
        this.coordId = CoordId(x, y);

        this._triangles = new Map<Triangle, number>();
        this.updateTriangles(triangles);
    }

    private dispatchEvent(evt : Event) {
        if (this.grid) this.grid.dispatchEvent(evt);
    }

    get right() : number {
        return this.left + this.width;
    }

    get bottom() : number {
        return this.top + this.height;
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

        if (this._triangles.size > 0) {
            this.recomputeColorGroups();
            this.recomputeShapeParameters();

            this.dispatchEvent(new TileEvent(Tile.events.UpdateTriangles, this));
        }
    }

    /**
     * Replace the triangles of this tile based on coordinates.
     *
     * @param newTriangles new set of triangle coordinates
     */
    updateTrianglesFromShape(newShape : TileShape) {
        const triangles = newShape.map((colorGroup) =>
            colorGroup.map((coord) => this.grid.getOrAddTriangle(...coord))
        );
        this.updateTriangles(triangles);
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
        this._rotations = undefined;
    }

    get rotations() : TileRotation[] {
        // TODO optimize -> precompute values?
        if (!this._rotations) {
            const tileVariants = this.computeRotationVariants(true, true);
            this._rotations = tileVariants.map((v) => v.rotation);
        }
        return this._rotations;
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
                neighbor.tile.type !== TileType.Placeholder &&
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
    computeRotationToFit(other : Tile, currentRotation : TileRotation) : TileRotation {
        let bestRotation : TileRotation = null;
        for (const rotation of other.rotations) {
            const newColors = this.matchShapeMapColors(other, rotation);
            if (newColors && this.checkFitColors(newColors)) {
                // find the rotation closest to the current angle
                if (bestRotation === null ||
                    angleDist(bestRotation.angle, currentRotation.angle) >
                    angleDist(rotation.angle, currentRotation.angle)) {
                    bestRotation = rotation;
                }
            }
        }
        return bestRotation;
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
    matchShapeMapColors(other : Tile, otherRotation : TileRotation, otherTriangle? : Triangle,
                        thisTriangle? : Triangle) : TileColors {
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
        const otherEdgeFrom = other.triangles[0].getOrAddRotationEdge(0);
        const otherEdgeTo = other.triangles[0].getOrAddRotationEdge(otherRotation.steps);
        if (!otherEdgeFrom || !otherEdgeTo) return null;
        const otherPairsRotated = other.computeRotatedTrianglePairs(otherEdgeFrom, otherEdgeTo);

        let rotatedOtherTriangle : Triangle;
        if (otherTriangle === undefined) {
            // find an anchor point
            thisTriangle = Grid.findTopLeftTriangle(this.triangles);
            rotatedOtherTriangle = Grid.findTopLeftTriangle([...otherPairsRotated.values()]);
        } else {
            // find the offset for the otherTriangle
            rotatedOtherTriangle = otherPairsRotated.get(otherTriangle);
        }

        // find the offset for the otherTriangle
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
        return Grid.computeRotatedTrianglePairs(this._triangles.keys(), edgeFrom, edgeTo);
    }

    /**
     * Computes the unique rotation variants of this tile, taking into account
     * the shape and color groups.
     * 
     * @param colorSensitive the color groups should match exactly
     * @param patternSensitive only return shapes that are included in the pattern
     * @returns a list of unique rotation variants
     */
    computeRotationVariants(colorSensitive? : boolean, patternSensitive? : boolean) : TileVariant[] {
        return this.grid.computeRotationVariants([...this._triangles.keys()], colorSensitive, patternSensitive);
    }
}
