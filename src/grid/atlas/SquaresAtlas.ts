// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { Atlas } from "../Atlas";

export const SquaresAtlas = Atlas.fromDefinition({
    name: "Square",
    shapes: {
        S: { name: "square", angles: [90, 90, 90, 90] },
    },
    vertices: [{ name: "square", vertex: "S0-S0-S0-S0" }],
});
