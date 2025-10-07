// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { GridDisplay } from "../grid/GridDisplay";

export class MainMenuGridDisplay extends GridDisplay {
    animated = false;
    margins = { top: 0, right: 0, bottom: 0, left: 0 };

    protected computeDimensionsForRescale(): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } | null {
        // diameter of a circle around the tile points,
        // with the mean as the center
        const bbox = this.grid.bbox;
        if (!bbox) return null;
        const tile = [...this.grid.tiles.values()][0];
        if (!tile) return bbox;
        const width = bbox.maxX - bbox.minX;
        const height = bbox.maxY - bbox.minY;
        const maxD = Math.max(width, height);
        const correction = Math.max(0, (0.5 * tile.area) / (maxD * maxD) - 0.4);
        const newBBox = {
            minX: bbox.minX - maxD * correction,
            minY: bbox.minY - maxD * correction,
            maxX: bbox.maxX + maxD * correction,
            maxY: bbox.maxY + maxD * correction,
        };
        return newBBox;
    }
}
