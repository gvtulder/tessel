/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import {
    BBox,
    Point,
    mergeBBox,
    weightedSumPoint,
    mergeBBoxItems,
} from "../geom/math";
import { Tile } from "./Tile";

/**
 * A set of tiles that maintains the area, centroid and bounding box.
 */
export class TileSet extends Set<Tile> {
    /**
     * The sum of the area of the tiles in the set.
     */
    area: number = 0;
    /**
     * The bounding box containing the tiles in the set.
     */
    bbox?: BBox;
    /**
     * The centroid of the tiles in the set.
     */
    centroid?: Point;

    /**
     * Adds a tile to the set.
     */
    add(tile: Tile): this {
        const sizeBefore = this.size;
        super.add(tile);
        if (this.size == sizeBefore) {
            return this;
        }
        if (this.size === 1) {
            this.area = tile.polygon.area;
            this.bbox = tile.bbox;
            this.centroid = tile.polygon.centroid;
        } else {
            const oldArea = this.area;
            this.area += tile.polygon.area;
            this.bbox = mergeBBox(this.bbox, tile.bbox);
            this.centroid = weightedSumPoint(
                this.centroid || { x: 0, y: 0 },
                tile.polygon.centroid,
                oldArea,
                tile.polygon.area,
                this.area,
            );
        }
        return this;
    }

    /**
     * Removes a tile from the set. Returns true if this was successful.
     */
    delete(tile: Tile): boolean {
        if (super.delete(tile)) {
            if (this.size == 0) {
                this.area = 0;
                this.bbox = undefined;
                this.centroid = undefined;
            } else {
                const oldArea = this.area;
                this.area -= tile.polygon.area;
                this.centroid = weightedSumPoint(
                    this.centroid || { x: 0, y: 0 },
                    tile.centroid,
                    oldArea,
                    -tile.polygon.area,
                    this.area,
                );
                this.bbox = mergeBBoxItems(this);
            }
            return true;
        }
        return false;
    }

    /**
     * Removes all tiles from the set.
     */
    clear(): void {
        super.clear();
        this.area = 0;
        this.bbox = undefined;
        this.centroid = undefined;
    }
}
