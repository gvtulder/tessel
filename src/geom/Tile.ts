import { Grid, GridEdge, GridVertex } from "./Grid";
import { GridEvent, GridEventType } from "./GridEvent";
import { BBox, Point } from "./math";
import { Polygon } from "./Polygon";
import { Shape } from "./Shape";

export const enum TileColor {
    Red = "red",
    Blue = "blue",
    Black = "black",
    Green = "green",
    White = "white",
}

class TileSegment {
    polygon: Polygon;
    color: TileColor;

    constructor(polygon: Polygon, color?: TileColor) {
        this.polygon = polygon;
        this.color = color;
    }
}

export class Tile extends EventTarget {
    vertices: GridVertex[];
    edges: GridEdge[];
    shape: Shape;
    polygon: Polygon;
    segments: TileSegment[];
    centroid: Point;
    bbox: BBox;
    data: unknown;

    private _colors: readonly TileColor[];

    constructor(shape: Shape, polygon: Polygon, segments?: Polygon[]) {
        super();
        this.shape = shape;
        this.polygon = polygon;
        this.centroid = polygon.centroid;
        this.bbox = polygon.bbox;
        if (segments) {
            this.segments = segments.map((s) => new TileSegment(s));
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
