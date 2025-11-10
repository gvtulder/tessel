/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Button } from "./Button";
import icons from "./icons";
import { NavBar } from "./NavBar";
import {
    NavigateEvent,
    Pages,
    UserEvent,
    UserEventType,
} from "../GameController";

export enum NavBarItems {
    MainMenu,
    AllGames,
    Paint,
    Settings,
}

export class MainNavBar extends NavBar {
    buttonKeys: NavBarItems[];

    constructor() {
        super("main-navbar");
        this.buttonKeys = [];

        // home
        this.addButton(
            new Button(
                icons.houseIcon,
                msg({ id: "ui.menu.MainMenuButton", message: "Home" }),
                (evt) => {
                    this.activeTab = NavBarItems.MainMenu;
                    this.dispatchEvent(new NavigateEvent(Pages.MainMenu));
                },
            ),
        );
        this.buttonKeys.push(NavBarItems.MainMenu);

        // all games
        this.addButton(
            new Button(
                icons.gridIcon,
                msg({ id: "ui.menu.AllGamesButton", message: "All Games" }),
                (evt) => {
                    this.activeTab = NavBarItems.AllGames;
                    this.dispatchEvent(new NavigateEvent(Pages.AllGames));
                },
            ),
        );
        this.buttonKeys.push(NavBarItems.AllGames);

        // paint
        this.addButton(
            new Button(
                icons.paintbrushIcon,
                msg({ id: "ui.menu.PaintButton", message: "Paint" }),
                (evt) => {
                    this.activeTab = NavBarItems.Paint;
                    this.dispatchEvent(new NavigateEvent(Pages.PaintMenu));
                },
            ),
        );
        this.buttonKeys.push(NavBarItems.Paint);

        // settings
        this.addButton(
            new Button(
                icons.gearsIcon,
                msg({ id: "ui.menu.SettingsButton", message: "Settings" }),
                (evt) => {
                    this.activeTab = NavBarItems.Settings;
                    this.dispatchEvent(new NavigateEvent(Pages.Settings));
                },
            ),
        );
        this.buttonKeys.push(NavBarItems.Settings);

        this.activeIndex = 0;
    }

    set activeTab(key: NavBarItems) {
        const index = this.buttonKeys.indexOf(key);
        if (index != -1) {
            this.activeIndex = index;
        }
    }
}
