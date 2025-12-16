/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { ArraySet } from "./ArraySet";

describe("ArraySet", () => {
    test("can add items", () => {
        const set = new ArraySet();
        set.add([1, 2, 3]);
        set.add([4, 3, 2]);
        set.add([1, 2, 3]);

        expect([...set.values()]).toStrictEqual([
            [1, 2, 3],
            [4, 3, 2],
        ]);

        expect(set.size).toBe(2);

        expect(set.has([1, 2, 3])).toBe(true);

        expect(set.has([4, 5, 6])).toBe(false);
        expect(set.has([4, 5])).toBe(false);
        expect(set.has([4, 5, 6, 7])).toBe(false);

        expect(set.has([])).toBe(false);
        set.add([]);
        expect(set.has([])).toBe(true);

        set.delete([]);
        set.delete([1, 2, 3]);
        set.delete([1, 2, 3]);
        expect(set.has([])).toBe(false);
        expect(set.has([1, 2, 3])).toBe(false);
    });

    test("can be initialized with something", () => {
        const set = new ArraySet([1, 2, 3]);
        expect(set.has([1, 2, 3])).toBe(true);
    });
});
