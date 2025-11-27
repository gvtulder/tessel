/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { Penrose3SourceGrid } from "./Penrose3SourceGrid";
import { testSourceGrid } from "../SourceGrid.testhelper";
import { seedPRNG } from "../../geom/RandomSampler";

describe("Penrose3SourceGrid", () => {
    test("can walk the grid", () => {
        const prng = seedPRNG(1234);
        const grid = new Penrose3SourceGrid(prng);
        const shapeCounts = testSourceGrid(grid);
        expect(shapeCounts.size).toBe(2);
        expect(shapeCounts.get(Penrose3SourceGrid.shapes[0])).toBe(64);
        expect(shapeCounts.get(Penrose3SourceGrid.shapes[1])).toBe(36);
    });

    test("can be saved", () => {
        const prng = seedPRNG(1234);
        const grid = new Penrose3SourceGrid(prng);
        const point = grid.getOrigin().neighbor(0).point;
        const saved = point.save();
        const restored = grid.restorePoint(saved);
        expect(restored).toBe(point);
        const savedGrid = grid.save();
        expect(Penrose3SourceGrid.restore(savedGrid)).toBeDefined();
    });
});
