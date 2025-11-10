/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { createElement } from "../shared/html";
import { GameListDisplay } from "./GameListDisplay";
import { defaultGameLists } from "src/saveGames";
import SVG_LOGO from "bundle-text:../svgs/logo.svg";
import { t } from "@lingui/core/macro";

export class MainMenuDisplay extends GameListDisplay {
    constructor(version?: string) {
        super(defaultGameLists[0]);
        this.element.classList.add("main-menu");

        const footer = createElement("div", "footer", this.element);

        const footerLine = createElement("p", "copyright", footer);
        footerLine.innerHTML = t({
            id: "ui.menu.footer",
            message: `A game by <a href="https://www.vantulder.net/">Gijs van Tulder</a>.`,
        });

        /*
        if (version) {
            const versionDiv = createElement("p", "version", footer);
            versionDiv.innerHTML = version;
        }
        */

        const logo = createElement("div", "logo", this.element);
        logo.innerHTML = SVG_LOGO;
    }

    destroy() {
        super.destroy();
    }
}
