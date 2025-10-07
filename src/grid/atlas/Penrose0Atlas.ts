/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Atlas } from "../Atlas";

export const Penrose0Atlas = Atlas.fromDefinition({
    name: "Penrose-3",
    shapes: {
        L: { name: "rhombus-wide", angles: [72, 108, 72, 108], frequency: 5 },
        S: { name: "rhombus-narrow", angles: [36, 144, 36, 144], frequency: 3 },
    },
    vertices: [
        { name: "kite", vertex: "L1-S1-L1" },
        { name: "deuce", vertex: "S1-L0-S1" },
        { name: "jack", vertex: "L0-L0-L0-S1" },
        { name: "ace", vertex: "L1-S0-L0-S0-L1" },
        { name: "king", vertex: "L0-L0-S0-S0-L0-L0" },
        { name: "queen", vertex: "L0-S0-S0-L0-S0-S0-L0" },
        { name: "sun/star", vertex: "L0-L0-L0-L0-L0" },
    ],
});
