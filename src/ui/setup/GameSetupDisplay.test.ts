/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test } from "vitest";
import { GameSetupDisplay } from "./GameSetupDisplay";

describe("GameSetupDisplay", () => {
    test("can be shown", () => {
        const screen = new GameSetupDisplay();
        screen.rescale();
        screen.destroy();
    });
});
