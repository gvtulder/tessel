/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { computePolygonSides } from "./computePolygonSides";
import { deg2rad } from "../math";

describe("computePolygonSides", () => {
    test.each([
        [[60, 60, 60], undefined, [1, 1, 1]],
        [[90, 90, 90, 90], undefined, [1, 1, 1, 1]],
        [
            [90, 90, 90, 90],
            [1, 2, 1, null],
            [1, 2, 1, 2],
        ],
        [
            [90, 90, 90, 90],
            [null, 2, 1, 2],
            [1, 2, 1, 2],
        ],
        [
            [90, 90, 90, 90],
            [1, null, 1, 2],
            [1, 2, 1, 2],
        ],
        [
            [120, 90, 120, 90, 120],
            [1, 1, 1, 1, null],
            [1, 1, 1, 1, Math.sqrt(3) - 1],
        ],
        [
            [120, 120, 90, 120, 90],
            [null, 1, 1, 1, 1],
            [Math.sqrt(3) - 1, 1, 1, 1, 1],
        ],
    ])(
        "can compute the sides of a polygon",
        (
            angles: readonly number[],
            sides: readonly (number | null)[] | undefined,
            expected: readonly number[],
        ) => {
            expect(
                computePolygonSides(deg2rad(angles), sides).map((x) =>
                    x.toFixed(4),
                ),
            ).toStrictEqual(expected.map((x) => x.toFixed(4)));
        },
    );

    test.each([
        [[60, 60, 60], []],
        [
            [60, 60, 60],
            [0, 0, 1],
        ],
        [[90, 90, 90], undefined],
        [
            [90, 90, 90, 90],
            [1, 1, 2, 1],
        ],
        [
            [90, 90, 90, 90],
            [1, null, null, 1],
        ],
    ])(
        "can throw errors",
        (
            angles: readonly number[],
            sides: readonly (number | null)[] | undefined,
        ) => {
            expect(() => {
                computePolygonSides(deg2rad(angles), sides);
            }).toThrow();
        },
    );
});
