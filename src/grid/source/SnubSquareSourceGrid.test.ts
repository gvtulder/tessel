/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { SnubSquareSourceGrid } from "./SnubSquareSourceGrid";
import { testSourceGrid } from "../SourceGrid.testhelper";

describe("SnubSquareSourceGrid", () => {
    test("can walk the grid", () => {
        const grid = new SnubSquareSourceGrid();
        const shapeCounts = testSourceGrid(grid);
        expect(shapeCounts.size).toBe(2);
        expect(
            shapeCounts.get(SnubSquareSourceGrid.shapes[0]),
        ).toBeGreaterThanOrEqual(33);
        expect(
            shapeCounts.get(SnubSquareSourceGrid.shapes[1]),
        ).toBeGreaterThanOrEqual(67);
    });

    test("can be saved", () => {
        const grid = new SnubSquareSourceGrid();
        const point = grid.getPoint(0, 1, 0);
        const saved = point.save();
        const restored = grid.restorePoint(saved);
        expect(restored).toBe(point);
        const savedGrid = grid.save();
        expect(SnubSquareSourceGrid.restore(savedGrid)).toBeDefined();
    });
});
