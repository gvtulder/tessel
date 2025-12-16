/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { edgeToAngle, TWOPI } from "../geom/math";
import { Shape } from "./Shape";
import { Tile } from "./Tile";

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
