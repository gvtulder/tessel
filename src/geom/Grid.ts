import {
    System as CollisionSystem,
    Polygon as CollisionPolygon,
    PointConstructor,
} from "detect-collisions";

import { Atlas } from "./Atlas";
import {
    BBox,
    comparePoint,
    edgeToAngle,
    mergeBBox,
    Point,
    weightedSumPoint,
} from "./math";
import { Shape } from "./Shape";
import { Tile } from "./Tile";
import { Polygon } from "./Polygon";
import { GridEvent, GridEventType } from "./GridEvent";

/**
 * The precision used for vertex and edge keys.
 */
const KEY_PRECISION = 1000;
/**
 * The proportion of overlap that counts as a collision.
 */
const OVERLAP_EPS = 1e-5;

/**
 * An identifier for the type of a corner in a shape.
 * Corners that can be matched after rotating the shape will
 * receive the same identifier.
 */
export type CornerType = number;

/**
 * A GridVertexCorner describes the corner connecting a
 * tile to a vertex.
 */
type GridVertexCorner = {
    /**
     * The tile.
     */
    tile: Tile; // the tile
    /**
     * The vertex index of the tile at this corner.
     */
    vertexIdx: number;
    /**
     * The angle of the edge leaving the vertex.
     * (Relative to grid coordinates.)
     */
    edgeAngle: number;
    /**
     * The interior angle of this corner.
     */
    cornerAngle: number; // the angle taken up by this corner
    /**
     * The shape of the tile.
     */
    shape: Shape;
    /**
     * The type of this corner.
     * Corners that can be matched by rotating the shape will
     * have the same corner type.
     */
    cornerType: CornerType;
};

/**
 * Maintains a list of corners around a vertex, sorted clockwise.
 */
export class SortedCorners extends Array<GridVertexCorner> {
    /**
     * Adds the tile to the list of corners.
     * @param tile the tile
     * @param vertexIdx the vertex of the tile to connect to this vertex
     */
    addTile(tile: Tile, vertexIdx: number) {
        const startEdgeAngle = edgeToAngle(tile.polygon.edges[vertexIdx]);
        let i = 0;
        while (i < this.length && startEdgeAngle > this[i].edgeAngle) {
            i++;
        }
        this.splice(i, 0, {
            tile: tile,
            vertexIdx: vertexIdx,
            edgeAngle: startEdgeAngle,
            cornerAngle: tile.shape.cornerAngles[vertexIdx],
            shape: tile.shape,
            cornerType: tile.shape.cornerTypes[vertexIdx],
        });
    }

    get tiles(): Tile[] {
        return this.map((c) => c.tile);
    }

    clone(): SortedCorners {
        return new SortedCorners(...this);
    }
}

type VertexKey = string;
type EdgeKey = string;

/**
 * Converts the point to a string-based key.
 */
function pointToKey(point: Point): VertexKey {
    return `${Math.round(point.x * KEY_PRECISION)} ${Math.round(point.y * KEY_PRECISION)}`;
}

/**
 * Converts the edge to a direction-invariant string-based key.
 */
function edgeToKey(a: Point, b: Point): EdgeKey {
    const ascending = comparePoint(a, b) < 0;
    return `${pointToKey(ascending ? a : b)} ${pointToKey(ascending ? b : a)}`;
}

/**
 * A GridVertex represents a point on the grid,
 * connecting one or more tiles.
 */
export class GridVertex {
    /**
     * The position of the vertex.
     */
    point: Point;
    /**
     * The corners/tiles connected to this vertex in clockwise order.
     */
    corners: SortedCorners;

    /**
     * Creates a new vertex at the given point.
     */
    constructor(point: Point) {
        this.point = point;
        this.corners = new SortedCorners();
    }

    /**
     * Returns the tiles connected to this vertex.
     */
    get tiles() {
        return this.corners.tiles;
    }

    /**
     * Connects the tile to this vertex.
     * @param tile the tile to connect
     * @param vertexIdx the vertex of the tile to connect to this vertex
     */
    addTile(tile: Tile, vertexIdx: number) {
        this.corners.addTile(tile, vertexIdx);
    }
}

/**
 * An edge connecting two vertices on the grid.
 */
export class GridEdge {
    /**
     * Vertex point A.
     */
    a: GridVertex;
    /**
     * Vertex point B.
     */
    b: GridVertex;
    /**
     * The tile with edge A-B.
     */
    tileA: Tile;
    /**
     * The tile with edge B-A.
     */
    tileB: Tile;

    /**
     * Creates a new edge connecting vertices A and B.
     *
     * The vertex is created as A-B or B-A, depending on which
     * coordinates come first in an ordered sequence.
     * If A < B, the vertex is A->B, if A > B, vertices A and B
     * are swapped.
     *
     * @param a the first vertex
     * @param b the second vertex
     */
    constructor(a: GridVertex, b: GridVertex) {
        if (comparePoint(a.point, b.point) < 0) {
            this.a = a;
            this.b = b;
        } else {
            this.a = b;
            this.b = a;
        }
    }
}

/**
 * A Grid maintains a collection of tiles in a plane.
 * It tracks the vertices and edges.
 */
export class Grid extends EventTarget {
    /**
     * Optional: an atlas used to check patterns.
     */
    atlas: Atlas;
    /**
     * The system for collision detection.
     */
    system: CollisionSystem;
    /**
     * A map of the vertices in this grid, by vertex key.
     */
    vertices: Map<VertexKey, GridVertex>;
    /**
     * A map of the currently used edges in this grid.
     */
    edges: Map<EdgeKey, GridEdge>;
    /**
     * The tiles currently on the grid.
     */
    tiles: Set<Tile>;
    /**
     * The edges connected to only one tile.
     */
    frontier: Set<GridEdge>;

    /**
     * The combined area of all tiles.
     */
    area: number;
    /**
     * The combined bounding box of all tiles.
     */
    bbox: BBox;
    /**
     * The combined centroid of all tiles.
     */
    centroid: Point;

    /**
     * Creates a new grid.
     * @param atlas an atlas for checking tile patterns (optional)
     */
    constructor(atlas?: Atlas) {
        super();

        this.atlas = atlas;
        this.system = new CollisionSystem();
        this.vertices = new Map<VertexKey, GridVertex>();
        this.edges = new Map<EdgeKey, GridEdge>();
        this.tiles = new Set<Tile>();
        this.frontier = new Set<GridEdge>();

        this.area = 0;
    }

    /**
     * Adds a tile to the grid.
     *
     * This function links the tile to vertices and edges and updates
     * the grid frontier if necessary.
     *
     * This function does only limited checking to prevent invalid grids.
     * Use checkFit to check for full checks for tile overlap et cetera.
     *
     * @param shape the shape of this tile
     * @param polygon the polygon of this tile
     * @returns the new tile
     */
    addTile(shape: Shape, polygon: Polygon): Tile {
        const tile = new Tile(shape, polygon);
        const points = polygon.vertices;
        const n = points.length;

        // add tile to grid
        this.tiles.add(tile);
        const collisionPolygon = this.system.createPolygon(
            {},
            polygon.vertices as Point[],
        );

        // link to vertices
        const vertices = new Array<GridVertex>(n);
        for (let i = 0; i < n; i++) {
            const point = points[i];
            const key = pointToKey(point);
            let vertex = this.vertices.get(key);
            if (vertex === undefined) {
                vertex = new GridVertex(point);
                this.vertices.set(key, vertex);
            }
            vertices[i] = vertex;
            vertex.addTile(tile, i);
        }
        tile.vertices = vertices;

        // link to edges
        const edges = new Array<GridEdge>(n);
        for (let i = 0; i < n; i++) {
            const a = vertices[i];
            const b = vertices[(i + 1) % n];
            const key = edgeToKey(a.point, b.point);
            let edge = this.edges.get(key);
            if (edge === undefined) {
                edge = new GridEdge(a, b);
                this.edges.set(key, edge);
            }
            edges[i] = edge;
            if (edge.a === a) {
                if (edge.tileA) throw new Error("edge already in use");
                edge.tileA = tile;
            } else {
                if (edge.tileB) throw new Error("edge already in use");
                edge.tileB = tile;
            }
            if (edge.tileA && edge.tileB) {
                this.frontier.delete(edge);
            } else {
                this.frontier.add(edge);
            }
        }
        tile.edges = edges;

        // update statistics
        const oldArea = this.area;
        this.area += polygon.area;
        this.bbox =
            this.bbox === undefined
                ? polygon.bbox
                : mergeBBox(this.bbox, polygon.bbox);
        this.centroid =
            this.centroid === undefined
                ? polygon.centroid
                : weightedSumPoint(
                      this.centroid,
                      polygon.centroid,
                      oldArea,
                      polygon.area,
                      this.area,
                  );

        this.dispatchEvent(new GridEvent(GridEventType.AddTile, this, tile));

        return tile;
    }

    /**
     * Removes a tile from the grid.
     * @param tile the tile to be removed
     */
    removeTile(tile: Tile): void {
        if (!this.tiles.has(tile)) return;

        const neighbors = tile.neighbors;

        // remove tile from edges
        for (const edge of tile.edges) {
            if (edge.tileA === tile) edge.tileA = null;
            if (edge.tileB === tile) edge.tileB = null;

            // remove orphaned edges
            if (!edge.tileA && !edge.tileB) {
                this.edges.delete(edgeToKey(edge.a.point, edge.b.point));
                this.frontier.delete(edge);
            }
        }

        // update frontier
        for (const neighbor of neighbors) {
            for (const edge of neighbor.edges) {
                if (!edge.tileA || !edge.tileB) {
                    this.frontier.add(edge);
                }
            }
        }

        this.tiles.delete(tile);
        this.dispatchEvent(new GridEvent(GridEventType.RemoveTile, this, tile));
    }

    /**
     * Checks if a tile would fit in the grid.
     * @param shape the shape of the new tile
     * @param polygon the polygon of the new tile
     * @returns true if the new tile would fit
     */
    checkFit(shape: Shape, polygon: Polygon): boolean {
        const tile = new Tile(shape, polygon);
        const points = polygon.vertices;
        const n = points.length;

        // find vertices
        const vertices = new Array<GridVertex>(n);
        const cornerLists = new Array<SortedCorners>(n);
        for (let i = 0; i < n; i++) {
            const point = points[i];
            const key = pointToKey(point);
            const vertex = this.vertices.get(key);
            vertices[i] = vertex;
            cornerLists[i] = new SortedCorners(
                ...(vertex ? vertex.corners : []),
            );
            cornerLists[i].addTile(tile, i);
        }

        // check edges
        const edges = new Array<GridEdge>(points.length);
        for (let i = 0; i < n; i++) {
            const a = vertices[i];
            const b = vertices[(i + 1) % n];
            // there can only be an edge if both vertices already exist
            if (a && b) {
                const key = edgeToKey(a.point, b.point);
                const edge = this.edges.get(key);
                if (
                    edge &&
                    ((edge.a == a && edge.tileA) || (edge.b == a && edge.tileB))
                ) {
                    // edge already in use
                    return false;
                }
            }
        }

        // check vertices using atlas
        if (this.atlas) {
            for (let i = 0; i < n; i++) {
                if (!this.atlas.checkMatch(cornerLists[i])) {
                    return false;
                }
            }
        }

        if (this.checkCollision(polygon)) {
            return false;
        }

        return true;
    }

    /**
     * Checks if the given polygon overlaps with any tiles on the grid.
     * @param polygon the polygon
     * @returns true if the polygon overlaps
     */
    checkCollision(polygon: Polygon): boolean {
        const collisionPolygon = new CollisionPolygon(
            {},
            polygon.vertices as Point[],
        );
        // this normally happens on system.insert
        collisionPolygon.bbox = collisionPolygon.getAABBAsBBox();
        collisionPolygon.minX =
            collisionPolygon.bbox.minX - collisionPolygon.padding;
        collisionPolygon.maxX =
            collisionPolygon.bbox.maxX - collisionPolygon.padding;
        collisionPolygon.minY =
            collisionPolygon.bbox.minY - collisionPolygon.padding;
        collisionPolygon.maxY =
            collisionPolygon.bbox.maxY - collisionPolygon.padding;
        return this.system.checkOne(
            collisionPolygon,
            (resp) => resp.overlap > OVERLAP_EPS,
        );
    }
}
