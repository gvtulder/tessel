/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Atlas } from "../Atlas";

export const AmmannBeenkerAtlas = Atlas.fromDefinition({
    name: msg({
        id: "atlas.AmmannBeenkerAtlas.friendlyName",
        message: "Ammann-Beenker",
    }),
    tilingName: msg({
        id: "atlas.AmmannBeenkerAtlas.tilingName",
        message: "Ammann-Beenker tiling",
    }),
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
        },
        R: {
            name: "rhombus",
            angles: [45, 135, 45, 135],
            frequency: 1,
            colorPatterns: [
                [[0, 1, 2, 3]],
                [
                    [0, 0, 1, 1],
                    [0, 1, 1, 0],
                ],
                [[0, 0, 0, 0]],
            ],
        },
    },
});
