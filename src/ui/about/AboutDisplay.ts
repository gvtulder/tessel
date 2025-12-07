/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { getLocalizedAboutHTML, updateI18n } from "../../i18n";

export class AboutDisplay extends ScreenDisplay {
    element: HTMLDivElement;

    constructor(version?: string) {
        super();

        // main element
        const element = (this.element = createElement(
            "div",
            "screen with-navbar about-display",
        ));

        // main page text
        const article = createElement("article", null, element);
        article.innerHTML = getLocalizedAboutHTML().replaceAll(
            "{setup}",
            "#setup",
        );

        // insert version number
        for (const p of article.getElementsByClassName("version-line")) {
            if (version) {
                p.innerHTML = p.innerHTML.replace("{version}", version);
            } else {
                p.remove();
            }
        }

        // initial scaling
        this.rescale();
    }

    destroy() {
        this.element.remove();
    }

    rescale() {}
}
