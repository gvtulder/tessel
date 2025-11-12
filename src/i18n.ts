/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import fs from "fs";
import { i18n, Messages } from "@lingui/core";
import { messages as messages_en } from "../i18n/en";
import { messages as messages_nl } from "../i18n/nl";
import { messages as messages_tr } from "../i18n/tr";
import { messages as messages_zhhant } from "../i18n/zh-Hant";
import { getStorageBackend } from "./lib/storage-backend";

export const languages = {
    en: {
        title: "English",
        messages: messages_en,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/en/about.html",
            "utf-8",
        ),
    },
    nl: {
        title: "Nederlands",
        messages: messages_nl,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/nl/about.html",
            "utf-8",
        ),
    },
    tr: {
        title: "Türkçe",
        messages: messages_tr,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/tr/about.html",
            "utf-8",
        ),
    },
    zh: {
        title: "繁體中文",
        messages: messages_zhhant,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/zh-Hant/about.html",
            "utf-8",
        ),
    },
} as {
    [key: string]: {
        title: string;
        messages: Messages;
        aboutHTML: string;
    };
};

for (const [language, data] of Object.entries(languages)) {
    i18n.load(language, data.messages);
}

export async function prepareI18n(navigatorLanguage: string) {
    const options = [
        await getStorageBackend().getItem("language"),
        navigatorLanguage,
        "en",
    ];
    for (const language of options) {
        if (!language) continue;
        if (languages[language]) {
            i18n.activate(language);
            return;
        }
        const firstPart = language.split("-")[0];
        if (languages[firstPart]) {
            i18n.activate(firstPart);
            return;
        }
    }
}

export function updateI18n(locale: string) {
    i18n.activate(locale);
}

export function getLocalizedAboutHTML(): string {
    return languages[i18n.locale]?.aboutHTML || languages["en"].aboutHTML;
}
