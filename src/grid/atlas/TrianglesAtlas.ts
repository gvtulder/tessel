// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { Atlas } from "../Atlas";

export const TrianglesAtlas = Atlas.fromDefinition({
    name: "Triangle",
    shapes: {
        T: {
            name: "triangle",
            angles: [60, 60, 60],
            colorPatterns: [[[0, 1, 2]], [[0, 1, 1]], [[0, 0, 0]]],
            preferredAngles: {
                initial: 180,
                display: 180,
                mainMenu: 180,
                stackDisplay: 180,
                setupAtlas: 180,
                setupSegments: 180,
            },
        },
    },
    vertices: [{ name: "triangle", vertex: "T0-T0-T0-T0-T0-T0" }],
});
