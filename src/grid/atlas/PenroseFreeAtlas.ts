/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Atlas } from "../Atlas";

export const PenroseFreeAtlas = Atlas.fromDefinition({
    id: "PenroseFreeAtlas",
    name: msg({
        id: "atlas.PenroseFreeAtlas.friendlyName",
        message: "Penrose-3 free",
    }),
    tilingName: msg({
        id: "atlas.PenroseFreeAtlas.tilingName",
        message: "Penrose-3 tiling",
    }),
    shapes: {
        L: {
            name: "rhombus-wide",
            angles: [72, 108, 72, 108],
            frequency: 5,
            preferredAngles: {
                display: 200,
                setupAtlas: 200,
            },
        },
        S: { name: "rhombus-narrow", angles: [36, 144, 36, 144], frequency: 3 },
    },
});
