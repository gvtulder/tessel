/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import icons from "../shared/icons";
import { UserEventType } from "../GameController";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { ThreeWayToggle } from "../shared/ThreeWayToggle";
import { Toggle } from "../shared/Toggle";
import { Toggles } from "../shared/toggles";
import doc from "bundle-text:./doc.html";

export class SettingsDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    backtomenubutton: Button;
    toggles: { [key: string]: Toggle | ThreeWayToggle };

    constructor(version?: string) {
        super();

        // main element
        const element = (this.element = createElement(
            "div",
            "screen settings-display",
        ));

        // menu button
        this.backtomenubutton = new Button(
            icons.houseIcon,
            "Back to menu",
            () => this.dispatchEvent(new Event(UserEventType.BackToMenu)),
            "backtomenu",
        );
        element.appendChild(this.backtomenubutton.element);

        // header
        const header = createElement("header", null, element);
        const h2 = createElement("h2", null, header);
        h2.innerHTML = "Tessel";

        // main page text
        const article = createElement("article", null, element);
        article.innerHTML = doc;

        // toggles
        this.toggles = {
            placeholders: Toggles.Placeholders(),
            autorotate: Toggles.Autorotate(),
            hints: Toggles.Hints(),
            snap: Toggles.Snap(),
            "color-scheme": Toggles.ColorScheme(),
        };

        // insert toggles in text
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
        this.backtomenubutton.destroy();
        for (const toggle of Object.values(this.toggles)) {
            toggle.destroy();
        }
        this.element.remove();
    }

    rescale() {}
}
