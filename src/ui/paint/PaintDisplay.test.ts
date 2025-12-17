/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test } from "vitest";
import { PaintDisplay } from "./PaintDisplay";
import { Grid } from "../../grid/Grid";
import { SquaresAtlas } from "../../grid/atlas/SquaresAtlas";

describe("PaintDisplay", () => {
    test("can be shown", () => {
        const grid = new Grid(SquaresAtlas);
        const screen = new PaintDisplay(grid);
        screen.rescale();
        screen.destroy();
    });
});
