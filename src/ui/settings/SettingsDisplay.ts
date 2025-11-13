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
import { msg, t } from "@lingui/core/macro";
import { updateI18n } from "../../i18n";
import { LanguagePicker } from "./LanguagePicker";
import { i18n } from "@lingui/core";
import { SmallNavBar, SmallNavBarItems } from "./SmallNavBar";

export class SettingsDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    navBar: SmallNavBar;
    languagePicker: LanguagePicker;
    toggles: { [key: string]: Toggle | ThreeWayToggle | LanguagePicker };

    constructor(version?: string) {
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
