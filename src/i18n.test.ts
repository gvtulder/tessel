/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { selectLanguage } from "./i18n";

describe("i18n", () => {
    test("selectLanguage", () => {
        expect(selectLanguage(["en"])).resolves.toBe("en");
        expect(selectLanguage(["nl"])).resolves.toBe("nl");
        expect(selectLanguage(["unknown"])).resolves.toBe("en");

        expect(selectLanguage(["en-US"])).resolves.toBe("en");
        expect(selectLanguage(["nl-NL"])).resolves.toBe("nl");

        expect(selectLanguage(["zh-Hans"])).resolves.toBe("zh-Hans");
        expect(selectLanguage(["zh-Hant"])).resolves.toBe("zh-Hant");

        expect(selectLanguage(["unknown", "nl", "fr"])).resolves.toBe("nl");
    });
});
