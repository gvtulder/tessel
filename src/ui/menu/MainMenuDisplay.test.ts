/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, jest, test, expect, beforeAll } from "@jest/globals";
import { MainMenuDisplay } from "./MainMenuDisplay";

describe("MainMenuDisplay", () => {
    test("can be created", () => {
        const display = new MainMenuDisplay();
        display.destroy();
    });
});
