/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Atlas } from "../Atlas";
import { Penrose3SourceGrid } from "../source/Penrose3SourceGrid";

export const Penrose3GridAtlas = Atlas.fromSourceGrid(
    "penrose",
    msg({ id: "atlas.Penrose3Grid.friendlyName", message: "Penrose-3 grid" }),
    msg({ id: "atlas.Penrose3Grid.tilingName", message: "Penrose-3 tiling" }),
    Penrose3SourceGrid,
);
