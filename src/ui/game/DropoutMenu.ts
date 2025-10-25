/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

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

    constructor() {
        this.buttons = [];
        this.toggles = [];

        this.element = createElement("div", "dropout-menu");

        const dropoutButton = (this.dropoutButton = new Button(
            icons.barsIcon,
            "Show menu",
            (evt: PointerEvent) => {
                this.element.classList.toggle("expanded");
            },
            "dropout",
        ));
        this.element.appendChild(dropoutButton.element);

        this.container = createElement("div", "items", this.element);

        this.backgroundEventHandler = (evt: PointerEvent) => {
            const target = evt.target as HTMLElement;
            if (!target.closest || !target.closest(".dropout-menu")) {
                this.element.classList.remove("expanded");
            }
        };
        window.addEventListener("pointerdown", this.backgroundEventHandler);
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
