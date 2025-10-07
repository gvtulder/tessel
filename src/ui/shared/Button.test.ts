/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, jest, test, expect, beforeAll } from "@jest/globals";
import { Button } from "./Button";

describe("Button", () => {
    test("can be created", () => {
        const tapHandler = jest.fn((evt: PointerEvent) => {});
        const button = new Button("a", "b", tapHandler);
        button.element.dispatchEvent(new MouseEvent("pointerdown"));
        expect(tapHandler).not.toHaveBeenCalled();
        button.element.dispatchEvent(new MouseEvent("pointerup"));
        expect(tapHandler).toHaveBeenCalled();
        button.destroy();
    });
});
