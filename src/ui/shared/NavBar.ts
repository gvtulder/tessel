/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Button } from "./Button";
import { createElement } from "./html";

export class NavBar extends EventTarget {
    element: HTMLElement;
    _activeIndex: number;
    buttons: Button[];
    listElement: HTMLUListElement;
    listItemElements: HTMLLIElement[];

    constructor(className: string) {
        super();
        const div = (this.element = createElement(
            "nav",
            `navbar ${className}`,
        ));
        this.buttons = [];
        this.listElement = createElement("ul", null, div);
        this.listItemElements = [];
        this._activeIndex = -1;
    }

    addButton(button: Button) {
        const li = createElement("li", null, this.listElement);
        li.appendChild(button.element);
        this.listItemElements.push(li);
        this.buttons.push(button);
    }

    set activeIndex(index: number) {
        if (this._activeIndex != index) {
            for (let i = 0; i < this.buttons.length; i++) {
                this.listItemElements[i].classList.toggle("active", index == i);
            }
        }
    }

    destroy() {
        for (const button of this.buttons) {
            button.destroy();
        }
    }

    show() {
        this.element.style.display = "";
    }

    hide() {
        this.element.style.display = "none";
    }
}
