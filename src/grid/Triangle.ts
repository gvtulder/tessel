import { dist, pointInTriangle, wrapModulo } from 'src/utils.js';
import { Grid } from './Grid.js';
import { Tile, TileType } from './Tile.js';

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

export type ColorGroup = number;
export type TriangleColor = string;
export type TileColors = readonly TriangleColor[];

export type TriangleParams = {
    shape?: number;
    tileMinGridPeriodX? : number;
    tileMinGridPeriodY? : number;
    tileGridPeriodX? : number;
    tileGridPeriodY? : number;
    xAtOrigin?: number;
    yAtOrigin?: number;
    points?: readonly [Coord, Coord, Coord];
    polyPoints?: ReadonlyArray<Coord>;
    left?: number;
    top?: number;
    neighborOffsets?: ReadonlyArray<Coord>;
    rotationOffsets?: ReadonlyArray<CoordEdge>;
    rotationAngles?: readonly number[];
}

export class TriangleEvent extends Event {
    triangle : Triangle;
    oldColor? : TriangleColor;
    newColor? : TriangleColor;
    oldTile? : Tile;
    newTile? : Tile;
    oldColorGroup? : ColorGroup;
    newColorGroup? : ColorGroup;

    constructor(type : string, triangle : Triangle,
                properties : {
                    oldColor? : TriangleColor, newColor? : TriangleColor,
                    oldTile? : Tile, newTile? : Tile,
                    oldColorGroup? : ColorGroup, newColorGroup? : ColorGroup
                }) {
        super(type);
        this.triangle = triangle;
        this.oldColor = properties.oldColor;
        this.newColor = properties.newColor;
        this.oldTile = properties.oldTile;
        this.newTile = properties.newTile;
        this.oldColorGroup = properties.oldColorGroup;
        this.newColorGroup = properties.newColorGroup;
    }
}

export abstract class Triangle {
    static events = {
        ChangeColor: 'changetilecolor',
        ChangeColorGroup: 'changetilecolor',
        ChangeTile: 'changetile',
    };

    grid: Grid;

    /**
     * The position of the triangle on the grid.
     */
    x: number;
    /**
     * The position of the triangle on the grid.
     */
    y: number;
    /**
     * The position of the triangle on the grid.
     */
    coord: Coord;
    /**
     * The position of the triangle on the grid.
     */
    coordId: CoordId;

    /**
     * The shape number for this triangle.
     *
     * Triangles with the same number look the same
     * (e.g., up/left/right/down).
     */
    shape: number;

    /**
     * The x position for this type of triangle nearest to the origin.
     */
    xAtOrigin: number;
    /**
     * The y position for this type of triangle nearest to the origin.
     */
    yAtOrigin: number;

    /**
     * The smallest number of x steps after which the triangle
     * pattern repeats. Used as the resolution for pattern-fitting.
     */
    tileMinGridPeriodX : number;

    /**
     * The smallest number of y steps after which the triangle
     * pattern repeats. Used as the resolution for pattern-fitting.
     */
    tileMinGridPeriodY : number;

    /**
     * The number of x steps after which the triangle pattern repeats.
     * A pattern shifted by this number should find the same shapes.
     */
    tileGridPeriodX : number;

    /**
     * The number of y steps after which the triangle pattern repeats.
     * A pattern shifted by this number should find the same shapes.
     */
    tileGridPeriodY : number;

    private _color: TriangleColor;
    private _tile : Tile | null;
    private _colorGroup : ColorGroup | null;
    private _placeholder : Tile | null;

    /**
     * Points of the three corners of this triangle.
     */
    points: readonly [Coord, Coord, Coord];
    /**
     * Points of the polygon (may overlap other polygons).
     */
    polyPoints: ReadonlyArray<Coord>;
    /**
     * Left position of this triangle in grid coordinates.
     */
    left: number;
    /**
     * Top position of this triangle in grid coordinates.
     */
    top: number;

    // neighbors in clockwise order
    neighborOffsets: ReadonlyArray<Coord>;

    // rotation in clockwise order
    rotationOffsets: ReadonlyArray<CoordEdge>;
    rotationAngles: readonly number[];

    /**
     * Constructs a new triangle on the grid.
     *
     * @param grid
     * @param x
     * @param y
     */
    constructor(grid : Grid, x: number, y: number) {
        this.grid = grid;
        this.x = x;
        this.y = y;
        this._color = null;
        this._tile = null;
        this._colorGroup = null;
        this._placeholder = null;

        this.coord = [x, y];
        this.coordId = CoordId(x, y);

        Object.assign(this, this.calc(x, y));
    }

    /**
     * Populate the type-specific parameters.
     */
    protected abstract calc(x : number, y : number) : TriangleParams;

    /**
     * Returns the type-specific parameters for a triangle at this coordinate.
     * @param x triangle coordinate x
     * @param y triangle coordinate y
     * @returns a parameters object
     */
    getGridParameters(x : number, y : number) : TriangleParams {
        return this.calc(x, y);
    }

    /**
     * Center of the triangle polygon in grid coordinates.
     */
    get center(): Coord {
        // incenter coordinates
        const w0 = dist(this.points[1], this.points[2]);
        const w1 = dist(this.points[0], this.points[2]);
        const w2 = dist(this.points[0], this.points[1]);
        const x = (w0 * this.points[0][0] + w1 * this.points[1][0] + w2 * this.points[2][0]) / (w0 + w1 + w2);
        const y = (w0 * this.points[0][1] + w1 * this.points[1][1] + w2 * this.points[2][1]) / (w0 + w1 + w2);
        return [x, y];
    }

    /**
     * Width of the triangle polygon in grid coordinates.
     */
    get width(): number {
        return Math.max(...this.points.map((p) => p[0]));
    }

    /**
     * Height of the triangle polygon in grid coordinates.
     */
    get height(): number {
        return Math.max(...this.points.map((p) => p[1]));
    }

    /**
     * Estimates the triangle coordinate for the grid position.
     * @param gridPos the grid position
     * @returns the closest triangle coordinate
     */
    protected abstract approxGridPositionToTriangleCoord(gridPos : Coord) : Coord;

    private dispatchEvent(evt : Event) {
        if (this.grid) this.grid.dispatchEvent(evt);
    }

    /**
     * Computes the closest triangle coordinate for the grid position.
     * @param gridPos the grid position
     * @returns the closest triangle coordinate
     */
    mapGridPositionToTriangleCoord(gridPos : Coord) : Coord {
        // find an approximate starting point
        const approx = this.approxGridPositionToTriangleCoord(gridPos);
        // try the actual polygons
        for (let r=0; r<100; r++) {
            for (let x=-r; x<r; x++) {
                for (let y=-r; y<r; y++) {
                    if (x==-r || x==r-1 || y==-r || y==r-1) {
                        const params = this.calc(x + approx[0], y + approx[1]);
                        if (pointInTriangle([
                                gridPos[0] - params.left,
                                gridPos[1] - params.top
                            ], params.points)) {
                            return [x + approx[0], y + approx[1]];
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Updates the color of this triangle.
     */
    set color(color: TriangleColor) {
        const changed = this._color != color;
        if (changed) {
            const old = color;
            this._color = color;
            this.dispatchEvent(new TriangleEvent(
                Triangle.events.ChangeColor, this,
                { oldColor: old, newColor: color }));
        }
    }

    /**
     * The color of the triangle.
     */
    get color(): TriangleColor {
        return this._color;
    }

    /**
     * Updates the color group of this triangle.
     */
    set colorGroup(colorGroup: ColorGroup) {
        const changed = this._colorGroup != colorGroup;
        if (changed) {
            const old = colorGroup;
            this._colorGroup = colorGroup;
            this.dispatchEvent(new TriangleEvent(
                Triangle.events.ChangeColorGroup, this,
                { oldColorGroup: old, newColorGroup: colorGroup }));
        }
    }

    /**
     * The color group within the current tile.
     */
    get colorGroup(): ColorGroup {
        return this._colorGroup;
    }

    /**
     * Returns true if this color would fit.
     */
    checkFitColor(color : TriangleColor) {
        const mismatch = this.getNeighbors().some((neighbor) => (
            neighbor.tile &&
            neighbor.tile.type !== TileType.Placeholder &&
            neighbor.color != color
        ));
        return !mismatch;
    }

    /**
     * Sets or unsets the tile this triangle belongs to.
     */
    set tile(tile: Tile | null) {
        const changed = this._tile !== tile;
        if (changed) {
            const old = this._tile;
            this._tile = tile;
            this._placeholder = null;
            this.dispatchEvent(new TriangleEvent(
                Triangle.events.ChangeTile, this,
                { oldTile: old, newTile: tile }));
        }
    }

    /**
     * The tile this triangle belongs to.
     */
    get tile(): Tile {
        return this._tile;
    }

    /**
     * Sets or unsets the placeholder this triangle belongs to.
     * (There can be more than one placeholder.)
     */
    set placeholder(placeholder : Tile | null) {
        if (placeholder) {
            this.tile = null;
            this._placeholder = placeholder;
        }
    }

    /**
     * The placeholder this triangle belongs to.
     * (There can be more than one placeholder.)
     */
    get placeholder() : Tile{
        return this._placeholder;
    }

    /**
     * Returns the neighbors of this triangle.
     *
     * @param includeNull include uninitialized triangles as null
     * @param addMissing initialize uninitialized triangles
     * @returns a list of neighbors for this triangle
     */
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

    /**
     * Returns the neighbors of this triangle, initializing as-yet uninitialized triangles.
     *
     * @returns a list of neighbors for this triangle
     */
    getOrAddNeighbors() : Triangle[] {
        return this.getNeighbors(true, true);
    }

    /**
     * Returns the rotation edge for the given rotation step.
     * Returns null if the rotation is invalid.
     *
     * @param rotation the rotation step
     * @param addMissing initialize triangles if necessary
     * @returns an Edge from this previous triangle to this one, in the rotation direction, or null
     */
    getRotationEdge(rotation : number, addMissing?: boolean) : Edge {
        const offset = this.rotationOffsets[wrapModulo(rotation, this.rotationOffsets.length)];
        return offset ? {
            from: this.grid.getTriangle(this.x + offset.from[0], this.y + offset.from[1], addMissing),
            to: this.grid.getTriangle(this.x + offset.to[0], this.y + offset.to[1], addMissing),
        } : null;
    }

    /**
     * Returns the rotation edge for the given rotation step, initializing all triangles.
     * Returns null if the rotation is invalid.
     *
     * @param rotation the rotation step
     * @returns an Edge from this previous triangle to this one, in the rotation direction, or null
     */
    getOrAddRotationEdge(rotation : number) : Edge {
        return this.getRotationEdge(rotation, true);
    }
}
