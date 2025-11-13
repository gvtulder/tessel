/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import icons from "../shared/icons";
import { UserEvent } from "../shared/UserEvent";
import { UserEventType } from "../shared/UserEvent";
import { Button } from "../shared/Button";
import { createElement } from "../shared/html";
import { msg } from "@lingui/core/macro";
import { GameListDisplay } from "./GameListDisplay";
import { defaultGameLists } from "../../saveGames";

export class AllGamesDisplay extends GameListDisplay {
    setupButton: Button;

    constructor(version?: string) {
        super(defaultGameLists[1]);

        // buttons
        const buttonRow = createElement(
            "div",
            "button-row top right",
            this.element,
        );

        const setupButton = new Button(
            icons.swatchbookIcon,
            msg({ id: "ui.menu.setupButton", message: "Design a game" }),
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.SetupMenu));
            },
            "button-setup-menu",
        );
        this.setupButton = setupButton;
        buttonRow.appendChild(setupButton.element);
    }

    destroy() {
        super.destroy();
        this.setupButton.destroy();
    }
}
