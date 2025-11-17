/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe } from "@jest/globals";
import { ConvexShapeScorer } from "./ConvexShapeScorer";
import { _, testScorer } from "./testScorer";

describe("ConvexShapeScorer", () => {
    testScorer(ConvexShapeScorer, [
        {
            name: "simple",
            def: [
                [0, 1],
                [2, 3],
            ],
            points: [1, 2, 0, 4],
        },
        {
            name: "complex",
            def: [
                [0, 1, 1, 5],
                [1, 2, 1, 3],
                [1, 1, 1, 4],
            ],
            points: [1, 0, 9, 0, 0, 12],
        },
        {
            name: "with a hole",
            def: [
                [4, 0, 0, 2],
                [1, 0, 5, 2],
                [1, 1, 1, 3],
            ],
            points: [0, 0, 0, 0, 0, 12],
        },
    ]);
});
