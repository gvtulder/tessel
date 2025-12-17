/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test } from "vitest";
import { PaintMenu } from "./PaintMenu";

describe("PaintMenu", () => {
    test("can be shown", () => {
        const screen = new PaintMenu();
        screen.rescale();
        screen.destroy();
    });
});
