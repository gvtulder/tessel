/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Atlas } from "../Atlas";

export const DeltoTrihexAtlas = Atlas.fromDefinition({
    name: "Deltoidal-trihexagonal",
    shapes: {
        P: {
            name: "kite",
            angles: [120, 90, 60, 90],
            sides: [1 / Math.sqrt(3), 1, 1, 1 / Math.sqrt(3)],
            colorPatterns: [
                [[0, 1, 2, 3]],
                [[0, 1, 2, 0]],
                [[0, 0, 1, 1]],
                [[0, 1, 1, 0]],
                [[0, 0, 0, 0]],
            ],
            preferredAngles: {
                setupAtlas: 30,
            },
        },
    },
    vertices: [
        { name: "a", vertex: "P0-P0-P0" },
        { name: "b", vertex: "P1-P3-P1-P3" },
        { name: "c", vertex: "P2-P2-P2-P2-P2-P2" },
    ],
});
