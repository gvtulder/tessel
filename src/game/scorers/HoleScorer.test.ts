/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe } from "@jest/globals";
import { HoleScorer } from "./HoleScorer";
import { _, testScorer } from "./testScorer";

describe("HoleScorer", () => {
    testScorer(HoleScorer, [
        {
            name: "simple",
            def: [
                [0, 1, 2, _],
                [0, _, 0, _],
                [0, 0, 0, 3],
            ],
            points: [0, 0, 1, 0],
        },
        {
            name: "double",
            def: [
                [0, 0, 0, 0, 0],
                [0, _, 2, _, 0],
                [1, 0, 0, 0, 0],
            ],
            points: [0, 1, [1, 1]],
        },
        {
            name: "multi",
            def: [
                [0, 0, 0, 0, 0],
                [0, 2, 3, 4, 0],
                [1, 0, 0, 0, 0],
            ],
            points: [0, 1, 0, 0, 0],
        },
    ]);
});
