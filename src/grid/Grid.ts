import {
    System as CollisionSystem,
    Polygon as CollisionPolygon,
    Body,
} from "detect-collisions";

import { Atlas } from "./Atlas";
import {
    BBox,
    centroid,
    comparePoint,
    dist,
    edgeToAngle,
    mergeBBox,
    Point,
    TWOPI,
    weightedSumPoint,
} from "../geom/math";
import { AngleUse, Shape } from "./Shape";
import { PlaceholderTile, Tile, TileColors } from "./Tile";
import { Polygon } from "../geom/Polygon";
import { matchPoints } from "../geom/polygon/matchPoints";
import { GridEvent, GridEventType } from "./GridEvent";
import { TileSet } from "./TileSet";
import { MatchEdgeColorsRuleSet, RuleSet as RuleSet } from "./RuleSet";
import { Rings } from "./Rings";
import { SourceGrid, SourcePoint } from "./SourceGrid";

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
    addTile(tile: Tile, vertexIdx: number): void {
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

    /**
     * Removes the tile from the list of corners.
     * @param tile the tile to remove
     */
    removeTile(tile: Tile): void {
        let index = 0;
        while (index < this.length && this[index].tile !== tile) {
            index++;
        }
        if (index < this.length) {
            this.splice(index, 1);
        }
    }

    /**
     * Returns the corner that follows the given tile.
     * @param tile a tile connected to this corner
     * @returns the next corner in clockwise order
     */
    findNextCorner(tile: Tile): GridVertexCorner | undefined {
        const n = this.length;
        if (n < 2) return undefined;
        let index = 0;
        while (index < n && this[index].tile !== tile) {
            index++;
        }
        return index < n ? this[(index + 1) % n] : undefined;
    }

    get tiles(): Tile[] {
        return this.map((c) => c.tile);
    }

    get complete(): boolean {
        let sum = 0;
        for (const corner of this) {
            sum += corner.cornerAngle;
        }
        return Math.abs(sum - TWOPI) < 1e-5;
    }

    clone(): SortedCorners {
        return new SortedCorners(...this);
    }
}

type VertexKey = string;
export type EdgeKey = string;

/**
 * A tile placement.
 */
type TileSuggestion = {
    shape: Shape;
    polygon: Polygon;
    sourcePoint?: SourcePoint;
};

/**
 * Converts the point to a string-based key.
 */
export function pointToKey(point: Point): VertexKey {
    return `${Math.round(point.x * KEY_PRECISION)} ${Math.round(point.y * KEY_PRECISION)}`;
}

/**
 * Converts the edge to a direction-invariant string-based key.
 */
export function edgeToKey(a: Point, b: Point): EdgeKey {
    const ascending = comparePoint(a, b) < 0;
    return `${pointToKey(ascending ? a : b)} ${pointToKey(ascending ? b : a)}`;
}

/**
 * Converts the edge to a direction-sensitive string-based key.
 */
export function edgeToDirectedKey(a: Point, b: Point): EdgeKey {
    return `${pointToKey(a)} ${pointToKey(b)}`;
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
     * The placeholders connected to this edge.
     */
    placeholders: Set<PlaceholderTile>;

    /**
     * Creates a new vertex at the given point.
     */
    constructor(point: Point) {
        this.point = point;
        this.corners = new SortedCorners();
        this.placeholders = new Set<PlaceholderTile>();
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
        if (tile instanceof PlaceholderTile) {
            this.placeholders.add(tile);
        } else {
            this.corners.addTile(tile, vertexIdx);
        }
    }

    /**
     * Removes the tile from this vertex.
     * @param tile the tile to remove
     */
    removeTile(tile: Tile) {
        if (tile instanceof PlaceholderTile) {
            this.placeholders.delete(tile);
        } else {
            this.corners.removeTile(tile);
        }
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
    tileA?: Tile | null;
    /**
     * The edge index for tile A.
     */
    edgeIdxA?: number | null;
    /**
     * The tile with edge B-A.
     */
    tileB?: Tile | null;
    /**
     * The edge index for tile B.
     */
    edgeIdxB?: number | null;
    /**
     * The placeholders using this edge.
     */
    placeholders: Set<PlaceholderTile>;

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
        this.placeholders = new Set<PlaceholderTile>();
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
     * An atlas used to check patterns.
     */
    atlas: Atlas;
    /**
     * The SourceGrid, if any, that determines tile placement
     */
    sourceGrid?: SourceGrid;
    /**
     * The rules for checking tile colors.
     */
    rules: RuleSet;
    /**
     * The system for collision detection.
     */
    system: CollisionSystem<Body<Tile>>;
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
    tiles: TileSet;
    /**
     * The placeholders currently on the grid.
     */
    placeholders: TileSet;
    /**
     * The edges connected to only one tile.
     */
    frontier: Set<GridEdge>;
    /**
     * The rings in the grid.
     */
    rings: Rings;

    private tileBodies: Map<Tile, Body<Tile>>;

    /**
     * Creates a new grid.
     * @param atlas an atlas for checking tile patterns (optional)
     * @param rules rules for matching colors (default: MatchEdgeColorsRuleSet)
     * @param sourceGrid a SourceGrid instance to guide tile placement
     */
    constructor(atlas: Atlas, rules?: RuleSet, sourceGrid?: SourceGrid) {
        if (!sourceGrid && atlas.sourceGrid) {
            console.log("new Grid: sourceGrid=", sourceGrid);
            sourceGrid = atlas.sourceGrid.create();
            console.log("new Grid: sourceGrid=", sourceGrid);
        }

        super();

        this.atlas = atlas;
        this.sourceGrid = sourceGrid;
        this.rules = rules || new MatchEdgeColorsRuleSet();
        this.system = new CollisionSystem();
        this.tileBodies = new Map<Tile, Body<Tile>>();
        this.vertices = new Map<VertexKey, GridVertex>();
        this.edges = new Map<EdgeKey, GridEdge>();
        this.tiles = new TileSet();
        this.placeholders = new TileSet();
        this.frontier = new Set<GridEdge>();
        this.rings = new Rings();

        this.handleTileColorUpdate = this.handleTileColorUpdate.bind(this);
    }

    /**
     * The combined area of all tiles.
     */
    get area(): number {
        return (this.tiles.area || 0) + (this.placeholders.area || 0);
    }

    /**
     * The combined bounding box of all tiles and placeholders.
     */
    get bbox(): BBox | undefined {
        return mergeBBox(this.tiles.bbox, this.placeholders.bbox);
    }

    /**
     * The bounding box for normal tiles only.
     */
    get bboxWithoutPlaceholders(): BBox | undefined {
        return this.tiles.bbox;
    }

    /**
     * The combined centroid of all tiles.
     */
    get centroid(): Point | undefined {
        if (this.tiles.size == 0 && this.placeholders.size == 0)
            return undefined;
        if (this.placeholders.size == 0) return this.tiles.centroid;
        if (this.tiles.size == 0) return this.placeholders.centroid;
        return weightedSumPoint(
            this.tiles.centroid || { x: 0, y: 0 },
            this.placeholders.centroid || { x: 0, y: 0 },
            this.tiles.area,
            this.placeholders.area,
        );
    }

    // TODO documentation
    addInitialTile(): Tile {
        const sourcePoint = this.sourceGrid && this.sourceGrid.getOrigin();
        const shape = sourcePoint ? sourcePoint.shape : this.atlas.shapes[0];
        const poly = shape.constructPreferredPolygon(
            0,
            0,
            1,
            AngleUse.InitialTile,
        );
        return this.addTile(shape, poly, poly.segment(), sourcePoint);
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
     * @param segments the segment polygons of this tile
     * @param sourcePoint TODO
     * @param placeholder TODO
     * @returns the new tile
     */
    addTile(
        shape: Shape,
        polygon: Polygon,
        segments?: Polygon[] | null,
        sourcePoint?: SourcePoint,
        placeholder?: boolean,
    ): Tile {
        // check for collisions with placeholders
        if (!placeholder) {
            const placeholders = this.checkCollision(polygon, true, true);
            if (placeholders) {
                for (const placeholder of placeholders) {
                    if (placeholder instanceof PlaceholderTile) {
                        this.removePlaceholder(placeholder);
                    }
                }
            }
        }

        const tile = placeholder
            ? new PlaceholderTile(shape, polygon, sourcePoint)
            : new Tile(shape, polygon, segments, sourcePoint);
        tile.onUpdateColor = this.handleTileColorUpdate;
        const points = polygon.vertices;
        const n = points.length;

        // add tile to grid
        if (placeholder) {
            this.placeholders.add(tile);
        } else {
            this.tiles.add(tile);
        }
        const collisionPolygon = this.system.createPolygon(
            {},
            polygon.vertices as Point[],
            { userData: tile },
        );
        this.tileBodies.set(tile, collisionPolygon);

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
            if (placeholder) {
                edge.placeholders.add(tile as PlaceholderTile);
            } else {
                // link to edge
                if (edge.a === a) {
                    if (edge.tileA) throw new Error("edge already in use");
                    edge.tileA = tile;
                    edge.edgeIdxA = i;
                } else {
                    if (edge.tileB) throw new Error("edge already in use");
                    edge.tileB = tile;
                    edge.edgeIdxB = i;
                }
                // update set of frontier edges
                if (edge.tileA && edge.tileB) {
                    this.frontier.delete(edge);
                } else {
                    this.frontier.add(edge);
                }
            }
        }
        tile.edges = edges;

        // update rings
        if (!placeholder) {
            this.rings.addRing(tile.polygon.vertices);
        }

        this.dispatchEvent(new GridEvent(GridEventType.AddTile, this, tile));

        return tile;
    }

    /**
     * Removes a tile from the grid.
     * @param tile the tile to be removed
     */
    removeTile(tile: Tile): void {
        const normalTile = this.tiles.has(tile);

        if (!this.tiles.delete(tile) && !this.placeholders.delete(tile)) return;

        const neighbors = tile.neighbors;

        // remove tile from vertices
        for (const vertex of tile.vertices) {
            vertex.removeTile(tile);
            if (vertex.corners.length == 0 && vertex.placeholders.size == 0) {
                this.vertices.delete(pointToKey(vertex.point));
            }
        }

        // remove tile from edges
        for (const edge of tile.edges) {
            if (edge.tileA === tile) edge.tileA = null;
            if (edge.tileB === tile) edge.tileB = null;
            edge.placeholders.delete(tile as PlaceholderTile);

            // remove orphaned edges
            if (!edge.tileA && !edge.tileB && edge.placeholders.size == 0) {
                this.edges.delete(edgeToKey(edge.a.point, edge.b.point));
                this.frontier.delete(edge);
            }
        }

        // update frontier
        for (const neighbor of neighbors) {
            for (const edge of neighbor.edges) {
                if (!!edge.tileA != !!edge.tileB) {
                    this.frontier.add(edge);
                }
            }
        }

        // update rings
        if (normalTile) {
            this.rings.removeRing(tile.polygon.vertices);
        }

        // delete from grid
        this.system.remove(this.tileBodies.get(tile) as Body);
        this.tileBodies.delete(tile);

        this.dispatchEvent(new GridEvent(GridEventType.RemoveTile, this, tile));
    }

    /**
     * Adds a placeholder tile to the grid.
     * @param shape the shape of the tile
     * @param polygon the polygon of the tile
     * @param sourcePoint TODO
     * @returns the new tile
     */
    addPlaceholder(
        shape: Shape,
        polygon: Polygon,
        sourcePoint?: SourcePoint,
    ): PlaceholderTile {
        return this.addTile(
            shape,
            polygon,
            null,
            sourcePoint,
            true,
        ) as PlaceholderTile;
    }

    /**
     * Removes a placeholder from the grid.
     */
    removePlaceholder(tile: PlaceholderTile): void {
        this.removeTile(tile);
    }

    /**
     * Checks if a tile would fit in the grid.
     * @param shape the shape of the new tile
     * @param polygon the polygon of the new tile
     * @param includePlaceholders collide with identical placeholders
     * @returns true if the new tile would fit
     */
    checkFit(
        shape: Shape,
        polygon: Polygon,
        includePlaceholders?: boolean,
    ): boolean {
        const tile = new Tile(shape, polygon);
        const points = polygon.vertices;
        const n = points.length;

        // find vertices
        const vertices = new Array<GridVertex>(n);
        const cornerLists = new Array<SortedCorners>(n);
        for (let i = 0; i < n; i++) {
            const point = points[i];
            const key = pointToKey(point);
            const vertex = this.vertices.get(key) as GridVertex;
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
            for (const cornerList of cornerLists) {
                if (!this.atlas.checkMatch(cornerList)) {
                    return false;
                }
            }
        }

        if (this.checkCollision(polygon, includePlaceholders)) {
            return false;
        }

        return true;
    }

    /**
     * Checks if the given polygon overlaps with any tiles on the grid.
     * @param polygon the polygon
     * @param includePlaceholders collide with identical placeholders
     * @param findAll if not set of false, the function returns only the first match
     * @returns the overlapping tiles if the polygon overlaps, or null
     */
    checkCollision(
        polygon: Polygon,
        includePlaceholders?: boolean,
        findAll?: boolean,
    ): Tile[] | null {
        const cp = new CollisionPolygon({}, polygon.vertices as Point[]);
        // this normally happens on system.insert
        cp.bbox = cp.getAABBAsBBox();
        cp.minX = cp.bbox.minX - cp.padding;
        cp.maxX = cp.bbox.maxX - cp.padding;
        cp.minY = cp.bbox.minY - cp.padding;
        cp.maxY = cp.bbox.maxY - cp.padding;
        const overlappingTiles = new Array<Tile>();
        this.system.checkOne(cp, (resp) => {
            if (resp.overlap < OVERLAP_EPS) return false;
            if (resp.b.userData instanceof PlaceholderTile) {
                if (!includePlaceholders) return false;
                if (resp.overlap < 1 - OVERLAP_EPS) return false;
            }
            overlappingTiles.push(resp.b.userData);
            return !findAll;
        });
        if (overlappingTiles.length > 0) {
            return overlappingTiles;
        } else {
            return null;
        }
    }

    /**
     * Checks if the color sequence would fit for this tile.
     */
    checkColors(tile: Tile, colors: TileColors): boolean {
        return this.rules.checkColors(tile, colors);
    }

    /**
     * Checks if the color sequence would fit this tile,
     * allowing for possible rotations.
     * Returns offset r if colors[i] = colors[i + r] fits.
     * @returns the valid rotation offsets
     */
    checkColorsWithRotation(tile: Tile, colors: TileColors): number[] {
        return tile.shape.rotationalSymmetries.filter((r) =>
            this.rules.checkColors(tile, colors, r),
        );
    }

    /**
     * Finds the best overlapping tile for the given polygon points.
     * @param points the vertices of a polygon
     * @param maxDist the maximum distance between matching points
     * @param includePlaceholders set to true to match placeholder tiles
     * @param shape only match tiles with this shape
     * @param matchCentroidOnly set to true match on centroid, not all points
     * @returns the best matching tile and offset, or null
     */
    findMatchingTile(
        points: readonly Point[],
        maxDist: number,
        includePlaceholders?: boolean,
        shape?: Shape,
        matchCentroidOnly?: boolean,
    ): {
        tile: Tile;
        offset?: number;
        dist: number;
        matchesPoints: boolean;
    } | null {
        const cp = new CollisionPolygon({}, points as Point[]);
        // this normally happens on system.insert
        cp.bbox = cp.getAABBAsBBox();
        cp.minX = cp.bbox.minX - cp.padding;
        cp.maxX = cp.bbox.maxX - cp.padding;
        cp.minY = cp.bbox.minY - cp.padding;
        cp.maxY = cp.bbox.maxY - cp.padding;
        const bestCandidate = {
            tile: null! as Tile,
            offset: 0 as number | undefined,
            dist: 0,
            matchesPoints: false,
        };
        const pointsCentroid = centroid(points);
        this.system.checkOne(cp, (resp) => {
            const other = resp.b.userData as Tile;
            // check for type
            if (!includePlaceholders && other instanceof PlaceholderTile) {
                return false;
            }
            // check for shape
            if (shape && other.shape !== shape) {
                return false;
            }
            // check for maximum distance of centroids
            const centroidDistance = dist(pointsCentroid, other.centroid);
            if (centroidDistance > maxDist) return false;
            // attempt to match points
            const match = matchPoints(other.polygon.vertices, points);
            // use distance to centroid as distance to object ...
            let distance = centroidDistance;
            let offset: number | undefined = undefined;
            // ... unless we require a point-to-point match
            if (!matchCentroidOnly) {
                if (!match || match.dist > maxDist) return false;
                distance = match.dist;
                offset = match.offset;
            }
            if (!bestCandidate.tile || bestCandidate.dist > distance) {
                bestCandidate.tile = other;
                bestCandidate.dist = distance;
                bestCandidate.offset = offset;
                bestCandidate.matchesPoints = !!match && match.dist < maxDist;
            }
            return false;
        });
        return bestCandidate.tile ? bestCandidate : null;
    }

    /**
     * Creates placeholder tiles for all frontier edges,
     * using the atlas to check for valid possibilities.
     */
    generatePlaceholders(): void {
        // collect all placeholders given the current tiles
        const newPlaceholders = new Set<TileSuggestion>();
        for (const edge of this.frontier) {
            for (const suggestion of this.computePossibilities(edge)) {
                const colliding = this.checkCollision(suggestion.polygon, true);
                if (colliding && colliding[0] instanceof PlaceholderTile) {
                    // this placeholder already exists
                    newPlaceholders.add(colliding[0]);
                } else {
                    newPlaceholders.add(
                        this.addPlaceholder(
                            suggestion.shape,
                            suggestion.polygon,
                            suggestion.sourcePoint,
                        ),
                    );
                }
            }
        }
        // remove placeholders that are on the grid
        // but are no longer required
        const stale = new Array<PlaceholderTile>();
        for (const placeholder of this.placeholders) {
            if (!newPlaceholders.has(placeholder)) {
                stale.push(placeholder);
            }
        }
        for (const placeholder of stale) {
            this.removePlaceholder(placeholder);
        }
    }

    /**
     * Generates a list of valid possible placeholders to place at the
     * given edge. Uses the atlas to check for valid possibilities.
     * @param edge the undirected edge to connect the placeholder to
     * @returns a list of new placement possibilities
     */
    computePossibilities(edge: GridEdge): TileSuggestion[] {
        if (!!edge.tileA == !!edge.tileB) return [];
        const tile = edge.tileA || edge.tileB;
        if (!tile) return [];
        if (tile.sourcePoint) {
            const edgeIdx = edge.tileA ? edge.edgeIdxA : edge.edgeIdxB;
            const neighbor = tile.sourcePoint.neighbor(edgeIdx!);
            const shape = neighbor.point.shape;
            const poly = shape.constructPolygonEdge(
                tile.polygon.outsideEdges[edgeIdx!],
                neighbor.side,
            );
            return [
                {
                    shape: neighbor.point.shape,
                    polygon: poly,
                    sourcePoint: neighbor.point,
                },
            ];
        }
        const ab = !edge.tileA
            ? { a: edge.a.point, b: edge.b.point }
            : { a: edge.b.point, b: edge.a.point };
        const possibilities = new Array<TileSuggestion>();
        for (const shape of this.atlas.shapes) {
            for (const r of shape.uniqueRotations) {
                const poly = shape.constructPolygonEdge(ab, r);
                if (this.checkFit(shape, poly)) {
                    possibilities.push({
                        shape: shape,
                        polygon: poly,
                    });
                }
            }
        }
        return possibilities;
    }

    /**
     * Broadcast the tile color update.
     */
    private handleTileColorUpdate(tile: Tile): void {
        this.dispatchEvent(
            new GridEvent(GridEventType.UpdateTileColors, this, tile),
        );
    }
}
