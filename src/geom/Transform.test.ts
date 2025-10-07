/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { TransformComponent, TransformList } from "./Transform";
import { P, Point } from "./math";

describe("TransformList", () => {
    const p = { x: 1, y: 1 };
    test.each([
        [[{ dx: 2, dy: -1 }], P(1, 3), P(3, 2)],
        [[{ scale: 2 }], P(1, 1), P(2, 2)],
        [[{ scale: 2, originX: 0.5, originY: 1.0 }], P(1, 2), P(1.5, 3)],
        [[{ scale: 2 }, { rotation: 0.5 * Math.PI }], P(1, 1), P(-2, 2)],
        [[{ rotation: 1.5 * Math.PI }], P(2, 3), P(3, -2)],
    ])(
        "computes forward transforms",
        (transforms: TransformComponent[], p: Point, expected: Point) => {
            const t = new TransformList(...transforms);
            const r = t.applyForward(p);
            expect(r.x).toBeCloseTo(expected.x);
            expect(r.y).toBeCloseTo(expected.y);
            const rr = t.applyBackward(r);
            expect(rr.x).toBeCloseTo(p.x);
            expect(rr.y).toBeCloseTo(p.y);
        },
    );
});
