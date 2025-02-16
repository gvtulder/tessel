import { GridEdge, GridVertex } from "./Grid";
import { BBox, Point } from "./math";
import { Polygon } from "./Polygon";
import { Shape } from "./Shape";

export class Tile {
    vertices: GridVertex[];
    edges: GridEdge[];
    shape: Shape;
    polygon: Polygon;
    centroid: Point;
    bbox: BBox;
    data: unknown;

    constructor(shape: Shape, polygon: Polygon) {
        this.shape = shape;
        this.polygon = polygon;
        this.centroid = polygon.centroid;
        this.bbox = polygon.bbox;
    }
}
