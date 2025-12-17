/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test } from "vitest";
import { AllGamesDisplay } from "./AllGamesDisplay";

describe("AllGamesDisplay", () => {
    test("can be shown", () => {
        const screen = new AllGamesDisplay();
        screen.rescale();
        screen.destroy();
    });
});
