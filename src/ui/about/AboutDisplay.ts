/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { NavigateEvent, Pages } from "../GameController";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { t } from "@lingui/core/macro";
import { getLocalizedAboutHTML, updateI18n } from "../../i18n";
import { SmallNavBar, SmallNavBarItems } from "../settings/SmallNavBar";

export class AboutDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    navBar: SmallNavBar;

    constructor(version?: string) {
        super();

        // main element
        const element = (this.element = createElement(
            "div",
            "screen with-navbar about-display",
        ));

        // navbar
        const navBar = (this.navBar = new SmallNavBar((page: Pages) => {
            this.dispatchEvent(new NavigateEvent(page));
        }));
        navBar.activeTab = SmallNavBarItems.About;
        element.appendChild(navBar.element);

        // main page text
        const article = createElement("article", null, element);
        article.innerHTML = getLocalizedAboutHTML();

        // insert version number
        for (const p of article.getElementsByClassName("version-line")) {
            if (version) {
                p.innerHTML = p.innerHTML.replace("VERSION", version);
            } else {
                p.remove();
            }
        }

        // initial scaling
        this.rescale();
    }

    destroy() {
        this.navBar.destroy();
        this.element.remove();
    }

    rescale() {}
}
