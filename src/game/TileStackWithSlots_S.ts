/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import * as zod from "zod";
import { TileShapeColors_S, TileStack_S } from "./TileStack";

export const TileStackWithSlots_S = zod.object({
    numberShown: zod.number(),
    slots: zod.array(zod.optional(zod.nullable(TileShapeColors_S))).readonly(),
    originalTileStack: TileStack_S,
    tileStack: TileStack_S,
});
export type TileStackWithSlots_S = zod.infer<typeof TileStackWithSlots_S>;
