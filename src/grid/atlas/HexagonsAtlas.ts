/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Atlas } from "../Atlas";

export const HexagonsAtlas = Atlas.fromDefinition({
    id: "HexagonsAtlas",
    name: msg({ id: "atlas.HexagonsAtlas.friendlyName", message: "Hexagon" }),
    tilingName: msg({
        id: "atlas.HexagonsAtlas.tilingName",
        message: "Hexagonal tiling",
    }),
    shapes: {
        H: { name: "hexagon", angles: [120, 120, 120, 120, 120, 120] },
    },
});
