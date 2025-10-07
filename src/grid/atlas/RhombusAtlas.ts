// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { Atlas } from "../Atlas";

export const RhombusAtlas = Atlas.fromDefinition({
    name: "Rhombus-60-120",
    shapes: {
        L: { name: "rhombus", angles: [60, 120, 60, 120] },
    },
    vertices: [
        { name: "a", vertex: "L0-L0-L0-L0-L0-L0" },
        { name: "b", vertex: "L1-L0-L0-L0-L0" },
        { name: "c", vertex: "L1-L1-L0-L0" },
        { name: "d", vertex: "L1-L0-L1-L0" },
        { name: "e", vertex: "L1-L1-L1" },
    ],
});
