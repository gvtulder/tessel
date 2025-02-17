import { GridEdge, GridVertex } from "./Grid";
import { BBox, Point } from "./math";
import { Polygon } from "./Polygon";
import { Shape } from "./Shape";

type TileColor = number;

class TileSegment {
    polygon: Polygon;
    color: TileColor;

    constructor(polygon: Polygon, color?: TileColor) {
        this.polygon = polygon;
        if (color !== undefined) {
            this.color = color;
        }
    }
}

export class Tile {
    vertices: GridVertex[];
    edges: GridEdge[];
    shape: Shape;
    polygon: Polygon;
    segments: TileSegment[];
    centroid: Point;
    bbox: BBox;
    data: unknown;

    constructor(shape: Shape, polygon: Polygon, segments?: Polygon[]) {
        this.shape = shape;
        this.polygon = polygon;
        this.centroid = polygon.centroid;
        this.bbox = polygon.bbox;
        if (segments) {
            this.segments = segments.map((s) => new TileSegment(s));
        }
    }
}
