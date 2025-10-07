/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { P } from "../math";
import { addPointToPolygon } from "./addPointToPolygon";

describe("addPointToPolygon", () => {
    test.each([
        [
            P([0, 0], [1, 0], [0.5, 0.5]),
            P(0.5, -0.5),
            P([0, 0], [0.5, -0.5], [1, 0], [0.5, 0.5]),
        ],
        [
            P([0, 0], [1, 0], [0.5, 0.5]),
            P(0, 0.3),
            P([0, 0], [1, 0], [0.5, 0.5], [0, 0.3]),
        ],
    ])("adds point to nearest edge", (points, newPoint, expected) => {
        expect(addPointToPolygon(points, newPoint)).toStrictEqual(expected);
    });

    test("adds two points", () => {
        const a = addPointToPolygon(P([0, 0], [1, 0], [0.5, 0.5]), P(0.6, 0.5));
        expect(a).toStrictEqual(P([0, 0], [1, 0], [0.6, 0.5], [0.5, 0.5]));
        const b = addPointToPolygon(a, P(0.4, 0.5));
        expect(b).toStrictEqual(
            P([0, 0], [1, 0], [0.6, 0.5], [0.5, 0.5], [0.4, 0.5]),
        );
    });
});
