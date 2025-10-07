// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { describe, expect, test } from "@jest/globals";
import { P } from "../math";
import { Polygon } from "../Polygon";
import { overlapArea } from "./overlapArea";

describe("overlapArea", () => {
    const triangle = P([0, 0], [1, -1], [2, 1]);
    const square = P([0, 0], [0, 1], [1, 1], [1, 0]);

    test("computes overlap", () => {
        const poly = new Polygon(triangle);
        expect(overlapArea(poly, poly)).toBe(poly.area);
        const sq = new Polygon(square);
        const tr = new Polygon(square.slice(0, 3));
        expect(overlapArea(sq, sq)).toBe(sq.area);
        expect(overlapArea(sq, tr)).toBe(tr.area);
        expect(overlapArea(tr, sq)).toBe(tr.area);
        expect(overlapArea(sq, P([2, 2], [3, 2], [2.5, 3]))).toBe(0);
    });
});
