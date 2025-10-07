/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Atlas } from "../Atlas";

export const SnubSquareAtlas = Atlas.fromDefinition({
    name: "Snub-Square",
    shapes: {
        S: {
            name: "square",
            angles: [90, 90, 90, 90],
            frequency: 1,
            colorPatterns: [
                [[0, 1, 2, 3]],
                [
                    [0, 0, 1, 1],
                    [0, 1, 1, 0],
                ],
                [[0, 0, 0, 0]],
            ],
            preferredAngles: {
                setupAtlas: 315,
            },
        },
        T: {
            name: "triangle",
            angles: [60, 60, 60],
            frequency: 2,
            colorPatterns: [
                [[0, 1, 2]],
                [
                    [0, 0, 1],
                    [0, 1, 0],
                    [1, 0, 0],
                ],
                [[0, 0, 0]],
            ],
        },
    },
    vertices: [{ name: "a", vertex: "S0-T0-S0-T0-T0" }],
});
