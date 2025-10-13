/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { expect, test } from "@jest/globals";
import { Scorer } from "./Scorer";
import {
    _ as underscore,
    MockGridBuilder,
    MockGridDefinition,
} from "../../grid/MockGridBuilder";

export const _ = underscore;

export type ScorerTestCase = {
    name: string;
    def: MockGridDefinition;
    points: (number | number[])[];
};

export function testScorer(
    scorerClass: typeof Scorer,
    testCases: ScorerTestCase[],
) {
    test.each(testCases)("can compute scores: $name", (s: ScorerTestCase) => {
        const scorer = scorerClass.create();

        const builder = MockGridBuilder.parseGridDefinition(s.def);

        const actualPoints = [];
        for (let i = 0; i < builder.numberOfSteps; i++) {
            const tiles = builder.applyStep(i);
            if (tiles.length > 0) {
                const scores = scorer.computeScores(builder.grid, tiles[0]);
                if (scores.length == 0) {
                    actualPoints.push(0);
                } else if (scores.length == 1) {
                    actualPoints.push(scores[0].points);
                } else {
                    actualPoints.push(scores.map((score) => score.points));
                }
            }
        }
        expect(actualPoints).toStrictEqual(s.points);
    });
}
