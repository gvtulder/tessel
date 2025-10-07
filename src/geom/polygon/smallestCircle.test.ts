// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { describe, expect, test } from "@jest/globals";
import { P, Point, TWOPI } from "../math";
import { smallestCircle } from "./smallestCircle";

describe("smallestCircle", () => {
    test.each([
        [P([0, 0], [1, 0], [1, 1], [0, 1]), P(0.5, 0.5), Math.SQRT1_2],
        [
            P([0, 0], [1, 0], [1, 1], [0, 1], [0.2, 0.5]),
            P(0.5, 0.5),
            Math.SQRT1_2,
        ],
        [P([-1, 0], [0, -1], [1, 0], [0, 1]), P(0, 0), 1],
        [P([-1, 2]), P(-1, 2), 0],
        [P([-1, 2], [0, 2]), P(-0.5, 2), 0.5],
        [P([-1, 0], [0, 0], [1, 0]), P(0, 0), 1],
        [P([-1, 0], [1, 0], [0, 0]), P(0, 0), 1],
        [P([0, 0], [-1, 0], [1, 0]), P(0, 0), 1],
        [
            [0, 2 / 3, 4 / 3].map((a) =>
                P(Math.cos(a * TWOPI), Math.sin(a * TWOPI)),
            ),
            P(0, 0),
            1,
        ],
    ] as [Point[], Point, number][])(
        "computes the smallest circle",
        (points, center, radius) => {
            const circle = smallestCircle(points);
            expect(circle.center.x).toBeCloseTo(center.x);
            expect(circle.center.y).toBeCloseTo(center.y);
            expect(circle.radius).toBeCloseTo(radius);
        },
    );

    test("can handle an empty list", () => {
        const circle = smallestCircle([]);
        expect(circle.center.x).toBeCloseTo(0);
        expect(circle.center.y).toBeCloseTo(0);
        expect(circle.radius).toBeCloseTo(0);
    });
});
