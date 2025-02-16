import { comparePoint, edgeToAngle, Point } from "./math";
import { Shape } from "./Shape";
import { Tile } from "./Tile";

export class Grid {
}

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