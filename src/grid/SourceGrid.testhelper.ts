/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { expect } from "vitest";
import { SourceGrid, SourcePoint } from "./SourceGrid";
import { Shape } from "./Shape";

/**
 * Tests a SourceGrid implementation by walking the grid and testing
 * for consistent neighbor links. Returns the observed shapes and
 * tile counts.
 * @returns the number of tiles for each observed shape
 */
export function testSourceGrid(
    grid: SourceGrid,
    numTiles: number = 100,
): Map<Shape, number> {
    const initialPoint = grid.getOrigin();
    expect(initialPoint.numSides).toBe(4);

    const shapeCounts = new Map<Shape, number>();
    let placed = 0;
    const seen = new Set<SourcePoint>([initialPoint]);
    const queue = [initialPoint];
    while (placed < numTiles && queue.length > 0) {
        const point = queue.shift()!;
        shapeCounts.set(point.shape, (shapeCounts.get(point.shape) || 0) + 1);
        placed++;
        for (let i = 0; i < point.numSides; i++) {
            const neighbor = point.neighbor(i);
            const reverseNeighbor = neighbor.point.neighbor(neighbor.side);
            expect(reverseNeighbor.point).toBe(point);
            if (!seen.has(neighbor.point)) {
                queue.push(neighbor.point);
                seen.add(neighbor.point);
            }
        }
    }
    return shapeCounts;
}
