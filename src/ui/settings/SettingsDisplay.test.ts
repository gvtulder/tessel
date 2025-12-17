/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test } from "vitest";
import { SettingsDisplay } from "./SettingsDisplay";

describe("SettingsDisplay", () => {
    test("can be shown", () => {
        const screen = new SettingsDisplay("1.0.23", "android");
        screen.rescale();
        screen.destroy();
    });
});
