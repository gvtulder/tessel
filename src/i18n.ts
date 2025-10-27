/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import fs from "fs";
import { i18n } from "@lingui/core";
import { messages as en } from "../i18n/en";

i18n.load("en", en);

export function prepareI18n(locale: string) {
    i18n.activate(locale);
}

export function getLocalizedSettingsHTML(): string {
    switch (i18n.locale) {
        default:
            return fs.readFileSync(
                __dirname + "/../i18n/settings/en.html",
                "utf-8",
            );
    }
}
