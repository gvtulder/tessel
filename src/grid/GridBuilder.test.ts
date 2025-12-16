/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { CentricGridBuilder } from "./GridBuilder";
import { Atlas } from "./Atlas";
import { HexagonsAtlas } from "./atlas/HexagonsAtlas";
import { SquaresAtlas } from "./atlas/SquaresAtlas";
import { TrianglesAtlas } from "./atlas/TrianglesAtlas";
import { RhombusAtlas } from "./atlas/RhombusAtlas";
import { seedPRNG } from "../geom/RandomSampler";

describe("GridBuilder", () => {
    test.each([
        ["SquaresAtlas", SquaresAtlas],
        ["TrianglesAtlas", TrianglesAtlas],
        ["RhombusAtlas", RhombusAtlas],
        ["HexagonsAtlas", HexagonsAtlas],
    ] as [string, Atlas][])(
        "builds a grid for %s",
        (_: string, atlas: Atlas) => {
            const prng = seedPRNG(1234);
            const builder = new CentricGridBuilder();
            const grid = builder.buildGrid(atlas, 100, prng);
            expect(grid.tiles.size).toBe(100);
        },
    );
});
