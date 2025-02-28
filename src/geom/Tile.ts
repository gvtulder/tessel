import { Grid, GridEdge, GridVertex } from "./Grid";
import { GridEvent, GridEventType } from "./GridEvent";
import { BBox, Point } from "./math";
import { Polygon } from "./Polygon";
import { Shape } from "./Shape";

/*
export const enum TileColor {
    Red = "red",
    Blue = "blue",
    Black = "black",
    Green = "green",
    White = "white",
}
*/

export type TileColor = string;
export type TileColors = TileColor[];

export const enum TileType {
    Normal,
    Placeholder,
}

export class TileSegment {
    tile: Tile;
    index: number;
    polygon: Polygon;
    color: TileColor;

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

    getNeighbors(includeMissing?: boolean): TileSegment[] {
        const tile = this.tile;
        const n = tile.segments.length;
        const neighbors = [
            tile.segments[(this.index + n - 1) % n],
            tile.segments[(this.index + 1) % n],
        ];
        const edge = tile.edges[this.index];
        if (edge.tileA == tile && edge.tileB && edge.tileB.segments) {
            neighbors.push(edge.tileB.segments[edge.edgeIdxB]);
        } else if (edge.tileB == tile && edge.tileA && edge.tileA.segments) {
            neighbors.push(edge.tileA.segments[edge.edgeIdxA]);
        } else if (includeMissing) {
            neighbors.push(null);
        }
        return neighbors;
    }
}

export class Tile extends EventTarget {
    tileType: TileType;
    vertices: GridVertex[];
    edges: GridEdge[];
    shape: Shape;
    polygon: Polygon;
    segments: TileSegment[];
    area: number;
    bbox: BBox;
    centroid: Point;
    data: unknown;

    private _colors: readonly TileColor[];

    constructor(
        shape: Shape,
        polygon: Polygon,
        segments?: Polygon[],
        tileType = TileType.Normal,
    ) {
        super();
        this.tileType = tileType;
        this.shape = shape;
        this.polygon = polygon;
        this.area = polygon.area;
        this.bbox = polygon.bbox;
        this.centroid = polygon.centroid;
        if (segments) {
            this.segments = segments.map((s, i) => new TileSegment(this, i, s));
        }
    }

    get neighbors(): Tile[] {
        const neighbors = new Set<Tile>();
        for (const edge of this.edges) {
            if (edge.tileA === this && edge.tileB) {
                neighbors.add(edge.tileB);
            } else if (edge.tileB === this && edge.tileA) {
                neighbors.add(edge.tileA);
            }
        }
        return [...neighbors];
    }

    get colors(): readonly TileColor[] {
        if (!this.segments || this.segments.length == 0) return undefined;
        return (this._colors ||= this.segments.map((s) => s.color));
    }

    set colors(colors: readonly TileColor[]) {
        this._colors = undefined;
        for (let i = 0; i < colors.length; i++) {
            this.segments[i].color = colors[i];
        }
        this.dispatchEvent(
            new GridEvent(GridEventType.UpdateTileColors, null, this),
        );
    }
}

export class PlaceholderTile extends Tile {
    constructor(shape: Shape, polygon: Polygon) {
        super(shape, polygon, null, TileType.Placeholder);
    }
}
