/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Atlas } from "../Atlas";

export const SquaresAtlas = Atlas.fromDefinition({
    id: "SquaresAtlas",
    name: msg({ id: "atlas.SquaresAtlas.friendlyName", message: "Square" }),
    tilingName: msg({
        id: "atlas.SquaresAtlas.tilingName",
        message: "Square tiling",
    }),
    shapes: {
        S: { name: "square", angles: [90, 90, 90, 90] },
    },
    vertices: [{ name: "square", vertex: "S0-S0-S0-S0" }],
});
