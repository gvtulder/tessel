import { GridEdge, GridVertex } from "./Grid";
import { GridEvent, GridEventType } from "./GridEvent";
import { BBox, Point } from "./math";
import { Polygon } from "./Polygon";
import { Shape } from "./Shape";

export type TileColor = string;
export type TileColors = readonly TileColor[];

export const enum TileType {
    /**
     * A standard Tile with segments and colors.
     */
    Normal,
    /**
     * A PlaceholderTile without segments or colors,
     * can overlap other placeholder tiles.
     */
    Placeholder,
}

/**
 * A TileSegment represents a segment of a tile
 * (usually a triangle) and has a color.
 */
export class TileSegment {
    /**
     * The tile of this segment.
     */
    tile: Tile;
    /**
     * The edge index of the edge connected to this segment.
     * See tile.edge[index].
     */
    index: number;
    /**
     * The polygon of this segment.
     */
    polygon: Polygon;
    /**
     * The color of this segment.
     */
    color?: TileColor;

    /**
     * Creates a new tile segment.
     * @param tile the tile this segment is part of
     * @param index the edge index of the edge that
     *              connects this segment (tile.edge[index])
     * @param polygon the polygon shape of this segment
     * @param color the color of the new segment
     */
    constructor(
        tile: Tile,
        index: number,
        polygon: Polygon,
        color?: TileColor,
    ) {
        this.tile = tile;
        this.index = index;
        this.polygon = polygon;
        this.color = color;
    }

    /**
     * Returns the neighboring tile segments of this segment.
     *
     * This includes both segments internal to this tile,
     * and the segment on the other side of the outside edge.
     *
     * If includeMissing is true, the list will include null
     * values for any edges of the segment without a neighbor.
     * If includeMissing is false, the list will only include
     * existing segments.
     */
    getNeighbors(includeMissing?: boolean): (TileSegment | null)[] {
        const tile = this.tile;
        if (!tile.segments) return [];
        const n = tile.segments.length;
        const neighbors = [
            tile.segments[(this.index + n - 1) % n],
            tile.segments[(this.index + 1) % n],
        ] as (TileSegment | null)[];
        const edge = tile.edges[this.index];
        if (edge.tileA == tile && edge.tileB && edge.tileB.segments) {
            neighbors.push(edge.tileB.segments[edge.edgeIdxB!]);
        } else if (edge.tileB == tile && edge.tileA && edge.tileA.segments) {
            neighbors.push(edge.tileA.segments[edge.edgeIdxA!]);
        } else if (includeMissing) {
            neighbors.push(null);
        }
        return neighbors;
    }
}

/**
 * A Tile represents a tile or placeholder on the grid.
 */
export class Tile extends EventTarget {
    /**
     * The type of this tile.
     */
    tileType: TileType;
    /**
     * The vertices forming the outline of this tile,
     * in clockwise order.
     */
    vertices!: GridVertex[];
    /**
     * The edges of this tile: clockwise order, with
     * edges[i] = vertices[i] -- vertices[i + 1].
     */
    edges!: GridEdge[];
    /**
     * The shape of this tile.
     */
    shape: Shape;
    /**
     * The polygon in grid coordinates of this tile.
     */
    polygon: Polygon;
    /**
     * The segments of this tile, or null.
     * segments[i] is connected to edge[i].
     */
    segments?: TileSegment[];
    /**
     * The area of the tile.
     */
    area: number;
    /**
     * The bounding box of the tile.
     */
    bbox: BBox;
    /**
     * The centroid coordinates of the tile.
     */
    centroid: Point;

    /**
     * Cache of the segment colors.
     */
    private _colors?: readonly TileColor[];

    /**
     * Constructs a new tile of the given shape and polygon.
     */
    constructor(
        shape: Shape,
        polygon: Polygon,
        segments?: Polygon[] | null,
        tileType = TileType.Normal,
    ) {
        super();
        // basic properties
        this.tileType = tileType;
        this.shape = shape;
        this.polygon = polygon;
        // precompute statistics
        this.area = polygon.area;
        this.bbox = polygon.bbox;
        this.centroid = polygon.centroid;
        // generate segments
        if (segments) {
            this.segments = segments.map((s, i) => new TileSegment(this, i, s));
        }
    }

    /**
     * Returns the neighbor tiles of this tile.
     * (This does not return placeholders.)
     */
    get neighbors(): ReadonlySet<Tile> {
        const neighbors = new Set<Tile>();
        for (const edge of this.edges) {
            if (edge.tileA === this && edge.tileB) {
                neighbors.add(edge.tileB);
            } else if (edge.tileB === this && edge.tileA) {
                neighbors.add(edge.tileA);
            }
        }
        return neighbors;
    }

    /**
     * Returns the colors of the tile segments,
     * or undefined if no segments are defined.
     */
    get colors(): readonly TileColor[] | undefined {
        if (!this.segments || this.segments.length == 0) return undefined;
        return (this._colors ||= this.segments.map((s) => s.color!));
    }

    /**
     * Updates the colors of the tile segments.
     * Triggers a GridEventType.UpdateTileColors event.
     */
    set colors(colors: readonly TileColor[] | TileColor) {
        this._colors = undefined;
        const segments = this.segments;
        if (!segments) return;
        for (let i = 0; i < segments.length; i++) {
            segments[i].color = colors instanceof Array ? colors[i] : colors;
        }
        this.dispatchEvent(
            new GridEvent(GridEventType.UpdateTileColors, undefined, this),
        );
    }
}

/**
 * A placeholder tile is a special tile that does not have colors
 * and can overlap other placeholders.
 */
export class PlaceholderTile extends Tile {
    constructor(shape: Shape, polygon: Polygon) {
        super(shape, polygon, null, TileType.Placeholder);
    }
}
