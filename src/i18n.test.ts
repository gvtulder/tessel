/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { selectLanguage } from "./i18n";

describe("i18n", () => {
    test("selectLanguage", async () => {
        await expect(selectLanguage(["en"])).resolves.toBe("en");
        await expect(selectLanguage(["nl"])).resolves.toBe("nl");
        await expect(selectLanguage(["unknown"])).resolves.toBe("en");

        await expect(selectLanguage(["en-US"])).resolves.toBe("en");
        await expect(selectLanguage(["nl-NL"])).resolves.toBe("nl");

        await expect(selectLanguage(["zh-Hans"])).resolves.toBe("zh-Hans");
        await expect(selectLanguage(["zh-Hant"])).resolves.toBe("zh-Hant");

        await expect(selectLanguage(["pt-BR"])).resolves.toBe("pt-BR");
        await expect(selectLanguage(["pt-PT"])).resolves.toBe("pt-BR");
        await expect(selectLanguage(["pt"])).resolves.toBe("pt-BR");

        await expect(selectLanguage(["unknown", "nl", "fr"])).resolves.toBe(
            "nl",
        );
    });
});
