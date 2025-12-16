/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import * as zod from "zod/v4-mini";
import { TileShapeColors_S, TileStack_S } from "./TileStack";

export const TileStackWithSlots_S = zod.object({
    numberShown: zod.number(),
    slots: zod.readonly(
        zod.array(zod.optional(zod.nullable(TileShapeColors_S))),
    ),
    originalTileStack: TileStack_S,
    tileStack: TileStack_S,
});
export type TileStackWithSlots_S = zod.infer<typeof TileStackWithSlots_S>;
