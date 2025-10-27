/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import fs from "fs";
import { i18n, Messages } from "@lingui/core";
import { messages as messages_en } from "../i18n/en";
import { messages as messages_nl } from "../i18n/nl";
import { getStorageBackend } from "./lib/storage-backend";

const languages = {
    en: {
        title: "English",
        messages: messages_en,
        settingsHTML: fs.readFileSync(
            __dirname + "/../i18n/settings/en.html",
            "utf-8",
        ),
    },
    nl: {
        title: "Nederlands",
        messages: messages_nl,
        settingsHTML: fs.readFileSync(
            __dirname + "/../i18n/settings/nl.html",
            "utf-8",
        ),
    },
} as {
    [key: string]: { title: string; messages: Messages; settingsHTML: string };
};

for (const [language, data] of Object.entries(languages)) {
    i18n.load(language, data.messages);
}

export async function prepareI18n() {
    let preference = await getStorageBackend().getItem("language");
    if (!preference) {
        preference = "en";
    }
    i18n.activate(preference);
}

export function updateI18n(locale: string) {
    i18n.activate(locale);
}

export function getLocalizedSettingsHTML(): string {
    return languages[i18n.locale]?.settingsHTML || languages["en"].settingsHTML;
}
