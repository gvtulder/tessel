/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import icons from "../shared/icons";
import { NavigateEvent } from "../shared/UserEvent";
import { Pages } from "../shared/UserEvent";
import { UserEventType } from "../shared/UserEvent";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { ThreeWayToggle } from "../shared/ThreeWayToggle";
import { Toggle } from "../shared/Toggle";
import { Toggles } from "../shared/toggles";
import { t } from "@lingui/core/macro";
import { updateI18n } from "../../i18n";
import { LanguagePicker } from "./LanguagePicker";
import { i18n } from "@lingui/core";
import { SmallNavBar, SmallNavBarItems } from "./SmallNavBar";
import { getShareBackend } from "../../lib/share-backend";

export class SettingsDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    navBar: SmallNavBar;
    languagePicker: LanguagePicker;
    toggles: { [key: string]: Toggle | ThreeWayToggle | LanguagePicker };

    constructor(version?: string, platform?: string) {
        super();

        // main element
        const element = (this.element = createElement(
            "div",
            "screen with-navbar settings-display",
        ));

        // navbar
        const navBar = (this.navBar = new SmallNavBar((page: Pages) => {
            this.dispatchEvent(new NavigateEvent(page));
        }));
        navBar.activeTab = SmallNavBarItems.Settings;
        element.appendChild(navBar.element);

        // main page text
        const article = createElement("article", null, element);
        const h3 = createElement("h3", null, article);
        h3.innerHTML = t({ id: "ui.settings.title", message: "Settings" });

        const addTwoLineOptionRow = (
            toggle: LanguagePicker | ThreeWayToggle,
            label: string,
        ) => {
            const div = createElement("div", "option label-before", article);
            const span = createElement("span", "label", div);
            span.innerHTML = label;
            div.appendChild(toggle.element);
        };

        const addOptionRow = (
            toggle: Toggle | ThreeWayToggle,
            label?: string,
        ) => {
            const div = createElement("div", "option label-aside", article);
            div.appendChild(toggle.element);
            if (label) {
                toggle.label = label;
            }
        };

        // language picker
        this.languagePicker = new LanguagePicker();
        const toggles = {
            placeholders: Toggles.Placeholders(),
            autorotate: Toggles.Autorotate(),
            hints: Toggles.Hints(),
            highscore: Toggles.Highscore(),
            colorScheme: Toggles.ColorScheme(),
            language: this.languagePicker,
        };
        this.toggles = toggles;

        addTwoLineOptionRow(
            this.languagePicker,
            t({
                id: "ui.settings.description.language",
                message: "Language",
            }),
        );
        addTwoLineOptionRow(
            toggles.colorScheme,
            t({
                id: "ui.settings.description.colorScheme",
                message: "Light mode, dark mode, or follow your device",
            }),
        );

        const h5 = createElement("h5", null, article);
        h5.innerHTML = t({
            id: "ui.settings.group.gameSettings",
            message: "Game settings",
        });

        addOptionRow(
            toggles.placeholders,
            t({
                id: "ui.settings.description.placeholders",
                message: "Show placeholder tiles",
            }),
        );
        addOptionRow(
            toggles.hints,
            t({
                id: "ui.settings.description.hints",
                message: "Highlight valid positions",
            }),
        );
        addOptionRow(
            toggles.autorotate,
            t({
                id: "ui.settings.description.autorotate",
                message: "Auto-rotate tiles",
            }),
        );
        addOptionRow(
            toggles.highscore,
            t({
                id: "ui.settings.description.highscore",
                message: "Show highscore",
            }),
        );

        // about section
        {
            const h4 = createElement("h3", null, article);
            h4.innerHTML = t({
                id: "ui.settings.about.title",
                message: "About the game",
            });

            const url = "https://www.vantulder.net/";
            createElement("p", null, article).innerHTML = t({
                id: "ui.settings.about.credits",
                message: `Tessel is a game by <a href="${url}">Gijs van Tulder</a>.`,
            });
        }

        // app store review prompt
        if (platform === "android") {
            const url =
                "https://play.google.com/store/apps/details?id=net.vantulder.tessel";
            const share = "#share";
            const p = createElement("p", "review-prompt", article);
            p.innerHTML = t({
                id: "ui.settings.about.reviewPromptGoogle",
                message: `Enjoying the game? <a href="${url}">Leave a review</a> in the Google Play Store or <a href="${share}">share the game with others</a>.`,
            });
        }
        if (platform === "ios") {
            const url =
                "https://apps.apple.com/app/tessel/id6754282700?action=write-review";
            const share = "#share";
            const p = createElement("p", "review-prompt", article);
            p.innerHTML = t({
                id: "ui.settings.about.reviewPromptApple",
                message: `Enjoying the game? <a href="${url}">Leave a review</a> in the App Store or <a href="${share}">share the game with others</a>.`,
            });
        }

        // email and issues
        {
            const email =
                "mailto:tessel-play@vantulder.eu?subject=Tessel%20feedback";
            const github = "https://github.com/gvtulder/tessel/issues";
            const p = createElement("p", "review-prompt", article);
            p.innerHTML = t({
                id: "ui.settings.about.feedbackPrompt",
                message: `Suggestions, comments, or bugs? <a href="${email}">Send me an email</a> or <a href="${github}">tell me on GitHub</a>.`,
            });
        }

        // open source link
        {
            const h4 = createElement("h3", null, article);
            h4.innerHTML = t({
                id: "ui.settings.opensource.title",
                message: "Open source",
            });

            const source = "https://tessel.vantulder.net/source/";
            const github = "https://github.com/gvtulder/tessel/";
            createElement("p", null, article).innerHTML = t({
                id: "ui.settings.opensource.source",
                message: `The <a href="${source}">source code</a> for this game is available under the GPL 3.0 license. See <a href="${github}">GitHub</a> for issues and pull requests.`,
            });

            const weblate = "https://hosted.weblate.org/engage/tessel/";
            createElement("p", null, article).innerHTML = t({
                id: "ui.settings.opensource.weblate",
                message: `Visit <a href="${weblate}">Weblate</a> to help with the translation.`,
            });
        }

        // version
        if (version) {
            createElement("p", "version-line", article).innerHTML = t({
                id: "ui.settings.version",
                message: `Version ${version}.`,
            });
        }

        // map share link
        for (const a of article.getElementsByTagName("a")) {
            if (a.href.endsWith("#share")) {
                // unlink the text ...
                const span = createElement("span");
                span.innerHTML = a.innerHTML;
                a.replaceWith(span);
                // ... until we find out that sharing is enabled
                getShareBackend()
                    .canShare()
                    .then((supported: boolean) => {
                        if (supported) {
                            a.addEventListener("click", (evt) => {
                                getShareBackend().share({
                                    title: "Tessel – A tile game",
                                    text: "Play Tessel – A tile game",
                                    url: "https://tessel.vantulder.net/",
                                    dialogTitle: "Share Tessel",
                                });
                                evt.preventDefault();
                                return false;
                            });
                            span.replaceWith(a);
                        }
                    });
            }
        }

        // initial scaling
        this.rescale();

        this.languagePicker.onchange = () => {
            updateI18n(this.languagePicker.selected!.key);
            // reload
            this.dispatchEvent(new NavigateEvent(Pages.Settings));
        };
        this.languagePicker.selectStoredOrDefault(i18n.locale);
    }

    destroy() {
        this.navBar.destroy();
        for (const toggle of Object.values(this.toggles)) {
            toggle.destroy();
        }
        this.element.remove();
    }

    rescale() {}
}
