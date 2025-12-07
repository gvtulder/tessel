/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { Button } from "../shared/Button";
import { createElement } from "../shared/html";
import icons from "../shared/icons";
import { ThreeWayToggle } from "../shared/ThreeWayToggle";
import { Toggle } from "../shared/Toggle";

export class DropoutMenu {
    element: HTMLDivElement;
    container: HTMLDivElement;
    dropoutButton: Button | Toggle | ThreeWayToggle;
    buttons: Button[];
    toggles: (Toggle | ThreeWayToggle)[];
    backgroundEventHandler: (evt: PointerEvent) => void;
    wasExpandedTimeout?: number;

    constructor() {
        this.buttons = [];
        this.toggles = [];

        this.element = createElement("div", "dropout-menu");

        const dropoutButton = (this.dropoutButton = new Button(
            icons.barsIcon,
            msg({ id: "ui.game.showMenuButton", message: "Show menu" }),
            () => {
                this.element.classList.toggle("expanded");
                this.updateWasExpandedTimeout();
            },
            "dropout",
        ));
        this.element.appendChild(dropoutButton.element);

        this.container = createElement("div", "items", this.element);

        this.backgroundEventHandler = (evt: PointerEvent) => {
            const target = evt.target as HTMLElement;
            if (!target.closest || !target.closest(".dropout-menu")) {
                if (this.element.classList.contains("expanded")) {
                    this.element.classList.remove("expanded");
                    this.updateWasExpandedTimeout();
                }
            }
        };
        window.addEventListener("pointerdown", this.backgroundEventHandler);
    }

    get isExpanded(): boolean {
        return this.element.classList.contains("expanded");
    }

    expand(): void {
        this.element.classList.add("expanded");
        this.updateWasExpandedTimeout();
    }

    get recentlyExpanded(): boolean {
        return this.isExpanded || this.wasExpandedTimeout !== undefined;
    }

    updateWasExpandedTimeout(): void {
        if (this.wasExpandedTimeout) {
            window.clearTimeout(this.wasExpandedTimeout);
        }
        this.wasExpandedTimeout = window.setTimeout(() => {
            this.wasExpandedTimeout = undefined;
        }, 500);
    }

    addButton(button: Button) {
        this.container.appendChild(button.element);
        this.buttons.push(button);
    }

    addToggle(toggle: Toggle | ThreeWayToggle) {
        this.container.appendChild(toggle.element);
        this.toggles.push(toggle);
    }

    destroy() {
        this.element.remove();
        this.dropoutButton.destroy();
        window.removeEventListener("pointerdown", this.backgroundEventHandler);
    }
}
