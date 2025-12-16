/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
    test("can be created", () => {
        const tapHandler = vi.fn((evt?: PointerEvent) => {});
        const button = new Button("a", "b", tapHandler);
        button.element.dispatchEvent(new MouseEvent("pointerdown"));
        expect(tapHandler).not.toHaveBeenCalled();
        button.element.dispatchEvent(new MouseEvent("pointerup"));
        expect(tapHandler).toHaveBeenCalled();
        button.destroy();
    });
});
