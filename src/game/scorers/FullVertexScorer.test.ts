/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe } from "@jest/globals";
import { FullVertexScorer } from "./FullVertexScorer";
import { _, testScorer } from "./testScorer";

describe("FullVertexScorer", () => {
    testScorer(FullVertexScorer, [
        {
            name: "simple",
            def: [
                [0, 1],
                [2, 3],
            ],
            points: [0, 0, 0, 4],
        },
        {
            name: "complex",
            def: [
                [0, 0, 0, _],
                [0, 1, 0, 2],
                [0, 0, 0, 3],
            ],
            points: [0, [4, 4, 4, 4], 0, 4],
        },
    ]);
});
