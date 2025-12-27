/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import fs from "fs";
import { i18n, Messages } from "@lingui/core";
import { messages as messages_ca } from "../i18n/ca";
import { messages as messages_de } from "../i18n/de";
import { messages as messages_en } from "../i18n/en";
import { messages as messages_es } from "../i18n/es";
import { messages as messages_fr } from "../i18n/fr";
import { messages as messages_gl } from "../i18n/gl";
import { messages as messages_nl } from "../i18n/nl";
import { messages as messages_ptbr } from "../i18n/pt-BR";
import { messages as messages_tr } from "../i18n/tr";
import { messages as messages_zhhans } from "../i18n/zh-Hans";
import { messages as messages_zhhant } from "../i18n/zh-Hant";
import { getStorageBackend } from "./lib/storage-backend";

export const languages = {
    ca: {
        title: "Català",
        messages: messages_ca,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/ca/about.html",
            "utf-8",
        ),
        languageTag: "ca-ES",
    },
    de: {
        title: "Deutsch",
        messages: messages_de,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/de/about.html",
            "utf-8",
        ),
        languageTag: "de-DE",
    },
    en: {
        title: "English",
        messages: messages_en,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/en/about.html",
            "utf-8",
        ),
        languageTag: "en-US",
    },
    es: {
        title: "Español",
        messages: messages_es,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/es/about.html",
            "utf-8",
        ),
        languageTag: "es-ES",
    },
    fr: {
        title: "Français",
        messages: messages_fr,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/fr/about.html",
            "utf-8",
        ),
        languageTag: "fr-FR",
    },
    gl: {
        title: "Galego",
        messages: messages_gl,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/gl/about.html",
            "utf-8",
        ),
        languageTag: "gl-ES",
    },
    nl: {
        title: "Nederlands",
        messages: messages_nl,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/nl/about.html",
            "utf-8",
        ),
        languageTag: "nl-NL",
    },
    "pt-BR": {
        title: "Português (brasileiro)",
        messages: messages_ptbr,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/pt-BR/about.html",
            "utf-8",
        ),
        languageTag: "pt-BR",
    },
    tr: {
        title: "Türkçe",
        messages: messages_tr,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/tr/about.html",
            "utf-8",
        ),
        languageTag: "tr-TR",
    },
    "zh-Hans": {
        title: "简体中文",
        messages: messages_zhhans,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/zh-Hans/about.html",
            "utf-8",
        ),
        languageTag: "zh-Hans",
    },
    "zh-Hant": {
        title: "繁體中文",
        messages: messages_zhhant,
        aboutHTML: fs.readFileSync(
            __dirname + "/../i18n/zh-Hant/about.html",
            "utf-8",
        ),
        languageTag: "zh-Hant",
    },
} as {
    [key: string]: {
        title: string;
        messages: Messages;
        aboutHTML: string;
        languageTag: string;
    };
};

for (const [language, data] of Object.entries(languages)) {
    i18n.load(language, data.messages);
}

export async function selectLanguage(
    options: (string | null)[],
): Promise<string> {
    for (const language of options) {
        if (!language) continue;
        if (languages[language]) {
            return language;
        }
        const firstPart = language.split("-")[0];
        if (languages[firstPart]) {
            return firstPart;
        }
        for (const locale of Object.keys(languages)) {
            if (firstPart == locale.split("-")[0]) {
                return locale;
            }
        }
    }
    return "en";
}

export async function prepareI18n(navigatorLanguage: string) {
    const options = [
        await getStorageBackend().getItem("language"),
        navigatorLanguage,
        "en",
    ];
    updateI18n(await selectLanguage(options));
}

export function updateI18n(locale: string) {
    i18n.activate(locale);
    if (languages[locale] && document && document.documentElement) {
        document.documentElement.lang = languages[locale].languageTag;
    }
}

export function getLocalizedAboutHTML(): string {
    return languages[i18n.locale]?.aboutHTML || languages["en"].aboutHTML;
}
