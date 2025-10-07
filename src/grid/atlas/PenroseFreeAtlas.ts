// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { Atlas } from "../Atlas";

export const PenroseFreeAtlas = Atlas.fromDefinition({
    name: "Penrose-3-free",
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
