/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { createElement } from "../shared/html";
import { GameListDisplay } from "./GameListDisplay";
import { defaultGameLists } from "../../saveGames";
import SVG_LOGO from "bundle-text:../svgs/logo.svg";
import { t } from "@lingui/core/macro";

export class MainMenuDisplay extends GameListDisplay {
    constructor(version?: string) {
        super(defaultGameLists[0]);
        this.element.classList.add("main-menu");

        const header = createElement("div", "header", this.element);

        const headerLine = createElement("p", "copyright", header);
        const url = "https://www.vantulder.net/";
        headerLine.innerHTML = t({
            id: "ui.menu.footer",
            message: `A game by <a href="${url}">Gijs van Tulder</a>.`,
        });

        /*
        if (version) {
            const versionDiv = createElement("p", "version", header);
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
