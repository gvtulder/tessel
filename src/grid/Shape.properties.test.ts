/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { rad2deg } from "../geom/math";
import { Shape } from "./Shape";

/**
 * A series of tests for all shapes and their properties,
 * checking for regressions.
 */
describe("Shape properties", () => {
    test.each([
        [
            "triangle",
            [[60, 60, 60]],
            {
                cornerAngles: [60, 60, 60],
                cornerTypes: [0, 0, 0],
                sides: [1, 1, 1],
                rotationalSymmetries: [0, 1, 2],
                uniqueRotations: [0],
                colorPatterns: [
                    {
                        numColors: 3,
                        segmentColors: [[0, 1, 2]],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0]],
                    },
                ],
            },
        ],
        [
            "square",
            [[90, 90, 90, 90]],
            {
                cornerAngles: [90, 90, 90, 90],
                cornerTypes: [0, 0, 0, 0],
                sides: [1, 1, 1, 1],
                rotationalSymmetries: [0, 1, 2, 3],
                uniqueRotations: [0],
                colorPatterns: [
                    {
                        numColors: 4,
                        segmentColors: [[0, 1, 2, 3]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [
                            [0, 0, 1, 1],
                            [0, 1, 1, 0],
                        ],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0, 0]],
                    },
                ],
            },
        ],
        [
            "rhombus-60-120",
            [[60, 120, 60, 120]],
            {
                cornerAngles: [60, 120, 60, 120],
                cornerTypes: [0, 1, 0, 1],
                sides: [1, 1, 1, 1],
                rotationalSymmetries: [0, 2],
                uniqueRotations: [0, 1],
                colorPatterns: [
                    {
                        numColors: 4,
                        segmentColors: [[0, 1, 2, 3]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 0, 1, 1]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 1, 1, 0]],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0, 0]],
                    },
                ],
            },
        ],
        [
            "hexagon",
            [[120, 120, 120, 120, 120, 120]],
            {
                cornerAngles: [120, 120, 120, 120, 120, 120],
                cornerTypes: [0, 0, 0, 0, 0, 0],
                sides: [1, 1, 1, 1, 1, 1],
                rotationalSymmetries: [0, 1, 2, 3, 4, 5],
                uniqueRotations: [0],
                colorPatterns: [
                    {
                        numColors: 6,
                        segmentColors: [[0, 1, 2, 3, 4, 5]],
                    },
                    {
                        numColors: 3,
                        segmentColors: [
                            [0, 0, 1, 1, 2, 2],
                            [0, 1, 1, 2, 2, 0],
                        ],
                    },
                    {
                        numColors: 2,
                        segmentColors: [
                            [0, 0, 0, 1, 1, 1],
                            [0, 0, 1, 1, 1, 0],
                            [0, 1, 1, 1, 0, 0],
                        ],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0, 0, 0, 0]],
                    },
                ],
            },
        ],
        [
            "penrose-rhombus-narrow",
            [[36, 144, 36, 144]],
            {
                cornerAngles: [36, 144, 36, 144],
                cornerTypes: [0, 1, 0, 1],
                sides: [1, 1, 1, 1],
                rotationalSymmetries: [0, 2],
                uniqueRotations: [0, 1],
                colorPatterns: [
                    {
                        numColors: 4,
                        segmentColors: [[0, 1, 2, 3]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 0, 1, 1]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 1, 1, 0]],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0, 0]],
                    },
                ],
            },
        ],
        [
            "penrose-rhombus-wide",
            [[72, 108, 72, 108]],
            {
                cornerAngles: [72, 108, 72, 108],
                cornerTypes: [0, 1, 0, 1],
                sides: [1, 1, 1, 1],
                rotationalSymmetries: [0, 2],
                uniqueRotations: [0, 1],
                colorPatterns: [
                    {
                        numColors: 4,
                        segmentColors: [[0, 1, 2, 3]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 0, 1, 1]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 1, 1, 0]],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0, 0]],
                    },
                ],
            },
        ],
        [
            "cairo-pentagon",
            [
                [120, 120, 90, 120, 90],
                [Math.sqrt(3) - 1, 1, 1, 1, 1],
            ],
            {
                cornerAngles: [120, 120, 90, 120, 90],
                cornerTypes: [0, 1, 2, 3, 4],
                sides: [Math.sqrt(3) - 1, 1, 1, 1, 1],
                rotationalSymmetries: [0],
                uniqueRotations: [0, 1, 2, 3, 4],
                colorPatterns: [
                    {
                        numColors: 5,
                        segmentColors: [[0, 1, 2, 3, 4]],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0, 0, 0]],
                    },
                ],
            },
        ],
        [
            "deltoidal-trihexagonal",
            [
                [120, 90, 60, 90],
                [1 / Math.sqrt(3), 1, 1, 1 / Math.sqrt(3)],
            ],
            {
                cornerAngles: [120, 90, 60, 90],
                cornerTypes: [0, 1, 2, 3],
                sides: [1 / Math.sqrt(3), 1, 1, 1 / Math.sqrt(3)],
                rotationalSymmetries: [0],
                uniqueRotations: [0, 1, 2, 3],
                colorPatterns: [
                    {
                        numColors: 4,
                        segmentColors: [[0, 1, 2, 3]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 0, 1, 1]],
                    },
                    {
                        numColors: 2,
                        segmentColors: [[0, 1, 1, 0]],
                    },
                    {
                        numColors: 1,
                        segmentColors: [[0, 0, 0, 0]],
                    },
                ],
            },
        ],
    ])("%s", (name, inputs, expected) => {
        const shape = new Shape(name, inputs[0], inputs[1]);
        expect(rad2deg(shape.cornerAngles)).toStrictEqual(
            expected.cornerAngles,
        );
        expect(shape.cornerAnglesDeg).toStrictEqual(expected.cornerAngles);
        expect(shape.sides.map((s) => s.toFixed(4))).toStrictEqual(
            expected.sides.map((s) => s.toFixed(4)),
        );
        expect(shape.rotationalSymmetries).toStrictEqual(
            expected.rotationalSymmetries,
        );
        expect(shape.uniqueRotations).toStrictEqual(expected.uniqueRotations);
        if (expected.colorPatterns) {
            expect(shape.colorPatterns).toStrictEqual(expected.colorPatterns);
        }
    });
});
