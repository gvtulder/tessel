// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { dist } from "../../geom/math";
import { GridDisplay } from "../grid/GridDisplay";

export class TileStackGridDisplay extends GridDisplay {
    margins = { top: 0, right: 0, bottom: 0, left: 0 };

    /**
     * Returns the dimensions of the content area (e.g., the display coordinates
     * of the triangles to be shown on screen.)
     * @returns the minimum dimensions
     */
    protected computeDimensionsForRescale(): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } | null {
        // diameter of a circle around the tile points,
        // with the mean as the center
        const bbox = this.grid.bbox;
        const centroid = this.grid.centroid;
        if (!bbox || !centroid) {
            return null;
        }
        let maxDist = Math.max(
            ...[...this.grid.tiles.values()]
                .flatMap((t) => t.polygon.vertices)
                .map((v) => dist(v, centroid)),
        );
        // compensation for almost-circular tiles, which would be too close to the edge otherwise
        maxDist = Math.max(0.6 * (bbox.maxX - bbox.minX), maxDist);
        return {
            minX: centroid.x - maxDist,
            minY: centroid.y - maxDist,
            maxX: centroid.x + maxDist,
            maxY: centroid.y + maxDist,
        };
    }
}
