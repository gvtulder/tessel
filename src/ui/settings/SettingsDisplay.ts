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
import { getLocalizedSettingsHTML, updateI18n } from "../../i18n";
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
        article.innerHTML = getLocalizedSettingsHTML();

        // toggles and language picker
        this.languagePicker = new LanguagePicker();
        this.toggles = {
            placeholders: Toggles.Placeholders(),
            autorotate: Toggles.Autorotate(),
            hints: Toggles.Hints(),
            snap: Toggles.Snap(),
            "color-scheme": Toggles.ColorScheme(),
            language: this.languagePicker,
        };

        // insert toggles and language picker in text
        for (const li of article.getElementsByTagName("li")) {
            const setting = li.getAttribute("data-setting");
            if (setting && this.toggles[setting]) {
                const description = li.innerHTML;
                li.innerHTML = "";
                li.appendChild(this.toggles[setting].element);
                const span = createElement("span", "", li);
                span.innerHTML = description;
            }
        }

        // convert internal links
        for (const a of article.getElementsByTagName("a")) {
            if (a.getAttribute("data-internal") == "setup") {
                const span = createElement("span", "icon");
                span.innerHTML = icons.swatchbookIcon;
                a.insertBefore(span, a.firstChild);
                a.classList.add("internal");
            }
        }

        // initial scaling
        this.rescale();

        this.languagePicker.onchange = () => {
            updateI18n(this.languagePicker.selected!.key);
            // reload
            this.dispatchEvent(new Event(UserEventType.Settings));
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
