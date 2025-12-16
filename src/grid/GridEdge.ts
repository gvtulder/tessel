/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { comparePoint } from "../geom/math";
import { GridVertex } from "./GridVertex";
import { Tile, PlaceholderTile } from "./Tile";

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
