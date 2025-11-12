/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import icons from "../shared/icons";
import { NavigateEvent, Pages, UserEventType } from "../GameController";
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

        // options list
        const ul = createElement("ul", "options", article);

        const addLi = (
            toggle: LanguagePicker | Toggle | ThreeWayToggle,
            description: string,
        ) => {
            const li = createElement("li", null, ul);
            li.appendChild(toggle.element);
            const span = createElement("span", "", li);
            span.innerHTML = description;
        };

        // language picker
        this.languagePicker = new LanguagePicker();
        this.toggles = {
            placeholders: Toggles.Placeholders(),
            autorotate: Toggles.Autorotate(),
            hints: Toggles.Hints(),
            snap: Toggles.Snap(),
            colorScheme: Toggles.ColorScheme(),
            language: this.languagePicker,
        };

        addLi(
            this.languagePicker,
            t({
                id: "ui.settings.description.language",
                message: "Language",
            }),
        );
        addLi(
            this.toggles.colorScheme,
            t({
                id: "ui.settings.description.colorScheme",
                message: "Light mode, dark mode, or follow your device",
            }),
        );
        addLi(
            this.toggles.placeholders,
            t({
                id: "ui.settings.description.placeholders",
                message: "Show placeholder tiles",
            }),
        );
        addLi(
            this.toggles.hints,
            t({
                id: "ui.settings.description.hints",
                message: "Highlight valid positions",
            }),
        );
        addLi(
            this.toggles.autorotate,
            t({
                id: "ui.settings.description.autorotate",
                message: "Auto-rotate tiles",
            }),
        );
        addLi(
            this.toggles.snap,
            t({
                id: "ui.settings.description.snap",
                message: "Snap tiles into place",
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
