/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test } from "vitest";
import { AboutDisplay } from "./AboutDisplay";

describe("AboutDisplay", () => {
    test("can be shown", () => {
        const screen = new AboutDisplay("1.0.23");
        screen.rescale();
        screen.destroy();
    });
});
