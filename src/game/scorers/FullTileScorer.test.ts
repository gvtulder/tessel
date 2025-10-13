/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe } from "@jest/globals";
import { FullTileScorer } from "./FullTileScorer";
import { _, testScorer } from "./testScorer";

describe("FullTileScorer", () => {
    testScorer(FullTileScorer, [
        {
            name: "simple",
            def: [[0, 1, 2]],
            points: [1, 1, 1],
        },
    ]);
});
