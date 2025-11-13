/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Button } from "../shared/Button";
import icons from "../shared/icons";
import { NavBar } from "../shared/NavBar";
import { NavigateEvent } from "../shared/UserEvent";
import { UserEvent } from "../shared/UserEvent";
import { Pages } from "../shared/UserEvent";
import { UserEventType } from "../shared/UserEvent";

export enum SmallNavBarItems {
    Settings,
    About,
    Statistics,
}

export class SmallNavBar extends NavBar {
    buttonKeys: SmallNavBarItems[];

    constructor(onNavigate: (page: Pages) => void) {
        super("small-navbar");
        this.buttonKeys = [];

        // settings
        this.addButton(
            new Button(
                icons.gearsIcon,
                msg({ id: "ui.menu.SettingsButton", message: "Settings" }),
                (evt) => {
                    this.activeTab = SmallNavBarItems.Settings;
                    if (onNavigate) onNavigate(Pages.Settings);
                },
                null,
                true,
            ),
        );
        this.buttonKeys.push(SmallNavBarItems.Settings);

        // how to play?
        this.addButton(
            new Button(
                icons.bookIcon,
                msg({ id: "ui.menu.HowToPlayButton", message: "How to play?" }),
                (evt) => {
                    this.activeTab = SmallNavBarItems.About;
                    if (onNavigate) onNavigate(Pages.About);
                },
                null,
                true,
            ),
        );
        this.buttonKeys.push(SmallNavBarItems.About);

        // statistics
        this.addButton(
            new Button(
                icons.chartIcon,
                msg({ id: "ui.menu.StatisticsButton", message: "Statistics" }),
                (evt) => {
                    this.activeTab = SmallNavBarItems.Statistics;
                    if (onNavigate) onNavigate(Pages.Statistics);
                },
                null,
                true,
            ),
        );
        this.buttonKeys.push(SmallNavBarItems.Statistics);

        this.activeIndex = 0;
    }

    set activeTab(key: SmallNavBarItems) {
        const index = this.buttonKeys.indexOf(key);
        if (index != -1) {
            this.activeIndex = index;
        }
    }
}
