/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Atlas } from "../Atlas";
import { SnubSquareSourceGrid } from "../source/SnubSquareSourceGrid";

export const SnubSquareGridAtlas = Atlas.fromSourceGrid(
    "snubsquare",
    msg({
        id: "atlas.SnubSquareGridAtlas.friendlyName",
        message: "Snub square grid",
    }),
    msg({
        id: "atlas.SnubSquareGridAtlas.tilingName",
        message: "Snub square tiling",
    }),
    SnubSquareSourceGrid,
);
