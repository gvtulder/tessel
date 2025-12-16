/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Point } from "../geom/math";
import { SortedCorners } from "./SortedCorners";
import { PlaceholderTile, Tile } from "./Tile";

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
