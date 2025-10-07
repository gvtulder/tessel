// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { describe, expect, test } from "@jest/globals";
import { P, Point } from "../math";
import { isConvexPolygon } from "./isConvexPolygon";

describe("isConvexPolygon", () => {
    test.each([
        [P([0, 0], [1, 0], [1, 1]), true],
        [P([0, 0], [1, 1], [1, 0]), true],
        [P([0, 0], [1, 0], [1, 1], [0, 1]), true],
        [P([0, 0], [1, 0], [0.5, 0.5], [1, 1], [0, 1]), false],
        [[], false],
    ])("can test polygon", (points: readonly Point[], expected: boolean) => {
        expect(isConvexPolygon(points)).toBe(expected);
    });
});
