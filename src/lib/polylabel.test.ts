// SPDX-License-Identifier: ISC AND GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { describe, expect, test } from "@jest/globals";
import { polylabel } from "./polylabel";
import { DEG2RAD, P, Point } from "../geom/math";

function polygonFromAngles(angles: number[], radius?: number): Point[] {
    radius = radius || 1;
    const points = [P(0, 0)];
    let angle = 0;
    let p = points[0];
    for (const a of angles) {
        angle -= a;
        p = P(
            p.x + Math.cos(angle * DEG2RAD) * radius,
            p.y + Math.sin(angle * DEG2RAD) * radius,
        );
        points.push(p);
    }
    return points;
}

describe("polylabel", () => {
    test.each([
        [
            "square",
            [P([-1, -1], [1, -1], [1, 1], [-1, 1])],
            { x: 0, y: 0, distance: 1 },
        ],
        [
            "rect",
            [P([0, -1], [1, -1], [1, 1], [0, 1])],
            { x: 0.5, y: 0, distance: 0.5 },
        ],
        [
            "rect2",
            [P([0, -1], [10, -1], [10, 1], [0, 1])],
            { x: 5, y: 0, distance: 1 },
        ],
        [
            "hex",
            [P([-2, -1], [0, -2], [2, -1], [2, 1], [0, 2], [-2, 1])],
            { x: 0, y: 0, distance: 1.78885 },
        ],
        [
            "poly1",
            [P([0, 0], [3, -2], [5, -1], [5, 1], [3, 1], [2, 0])],
            { x: 3.53439, y: -0.29025, distance: 1.29021 },
        ],
        [
            "poly2",
            [P([0, 0], [0, -2], [2, -2], [2, -1], [1, -1], [1, 0])],
            { x: 0.58575, y: -1.41424, distance: 0.58575 },
        ],
        [
            "poly3",
            [
                P(
                    [0, 0],
                    [1, 0],
                    [1, 0.4],
                    [2, 0.4],
                    [2, 0],
                    [3, 0],
                    [3, 0.4],
                    [4, 0.4],
                    [4, 0],
                    [5, 0],
                    [5, 1],
                    [4, 1],
                    [4, 0.6],
                    [3, 0.6],
                    [3, 1],
                    [2, 1],
                    [2, 0.6],
                    [1, 0.6],
                    [1, 1],
                    [0, 1],
                ),
            ],
            { x: 2.5, y: 0.5, distance: 0.5 },
        ],
        [
            "poly4",
            [
                P(
                    [0, 0],
                    [1, 0],
                    [1, 0.4],
                    [2, 0.4],
                    [2, 0.1],
                    [3, 0.1],
                    [3, 0.4],
                    [4, 0.4],
                    [4, 0],
                    [5, 0],
                    [5, 1],
                    [4, 1],
                    [4, 0.6],
                    [3, 0.6],
                    [3, 1],
                    [2, 1],
                    [2, 0.6],
                    [1, 0.6],
                    [1, 1],
                    [0, 1],
                ),
            ],
            { x: 0.5, y: 0.5, distance: 0.5 },
        ],
        [
            "poly5",
            [
                polygonFromAngles([
                    30, 0, 60, -60, 60, 60, -60, 120, -60, 60, 60, 60, 60, -120,
                    -60, 60, -60, 120,
                ]),
            ],
            { x: 1.73163, y: -3, distance: 0.86598 },
        ],
        [
            "poly6",
            [polygonFromAngles([30, -60, 60, 60, 120, -60, 60, -60, 120, 60])],
            { x: 0.86542, y: -0.96387, distance: 0.46387 },
        ],
        [
            "poly7",
            [
                polygonFromAngles([
                    30, 60, -60, 0, -60, 120, -60, 120, 60, -120, 60, 60, -60,
                    120, 60, -60, -60, 60, -60, 120,
                ]),
            ],
            { x: 1.78107, y: -3.08533, distance: 0.91504 },
        ],
        [
            "poly8",
            [polygonFromAngles([30, 120, -60, 60, 60, 120, -60, 60])],
            { x: -0.40209, y: -0.76843, distance: 0.46393 },
        ],
    ])(
        "can find the center of a polygon: %s",
        (
            name: string,
            polygon: Point[][],
            expected: Point & { distance: number },
        ) => {
            const pole = polylabel(polygon, 0.001, 0.01);
            expect(pole).toEqual({
                x: expect.closeTo(expected.x),
                y: expect.closeTo(expected.y),
                distance: expect.closeTo(expected.distance),
            });
        },
    );
});
