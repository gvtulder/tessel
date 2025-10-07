/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Atlas } from "../Atlas";

export const CairoAtlas = Atlas.fromDefinition({
    name: "Cairo pentagonal",
    shapes: {
        P: {
            name: "pentagon",
            angles: [120, 120, 90, 120, 90],
            //        P0   P1  P2   P3  P4
            // first side: 2 * sqrt(2) * cos(75deg)
            sides: [Math.sqrt(3) - 1, 1, 1, 1, 1],
            colorPatterns: [
                [[0, 1, 2, 3, 4]],
                [[0, 1, 1, 2, 2]],
                [[0, 0, 0, 0, 0]],
            ],
            preferredAngles: {
                setupAtlas: 180,
                setupSegments: 180,
            },
        },
    },
    vertices: [
        { name: "a", vertex: "P0-P3-P1" },
        { name: "b", vertex: "P2-P2-P2-P2" },
        { name: "c", vertex: "P4-P4-P4-P4" },
    ],
});
