/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Atlas } from "../Atlas";

export const HexagonsAtlas = Atlas.fromDefinition({
    name: "Hexagon",
    shapes: {
        H: { name: "hexagon", angles: [120, 120, 120, 120, 120, 120] },
    },
});
