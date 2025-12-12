/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Button } from "./Button";
import { DestroyableEventListenerSet } from "./DestroyableEventListenerSet";
import { DragHandler, DragHandlerEvent } from "./DragHandler";
import { createElement } from "./html";

export enum NavBarItems {
    MainMenu = 1,
    AllGames,
    Paint,
    Settings,
    About,
    Statistics,
}

export class NavBar extends EventTarget {
    element: HTMLElement;
    _activeIndex: number;
    buttons: Button[];
    buttonKeys: NavBarItems[];
    listElement: HTMLUListElement;
    listItemElements: HTMLLIElement[];
    dragHandler: DragHandler;
    listeners: DestroyableEventListenerSet;
    _visible?: boolean;

    constructor(className: string) {
        super();
        const div = (this.element = createElement(
            "nav",
            `navbar ${className}`,
        ));
        this.buttons = [];
        this.buttonKeys = [];
        this.listElement = createElement("ul", null, div);
        this.listItemElements = [];
        this._activeIndex = -1;

        this.listeners = new DestroyableEventListenerSet();
        this.listeners.addEventListener(this.element, "animationend", () => {
            this.element.classList.toggle("hidden", !this._visible);
            this.element.classList.remove("appear", "disappear");
        });

        let buttonRects: DOMRect[] = [];

        this.dragHandler = new DragHandler(this.listElement, false, "touch");
        this.dragHandler.onDragStart = (evt: DragHandlerEvent) => {
            buttonRects = [];
            for (const button of this.buttons) {
                buttonRects.push(button.element.getBoundingClientRect());
            }
            evt.event.stopPropagation();
            evt.event.preventDefault();
        };
        this.dragHandler.onDragMove = (evt: DragHandlerEvent) => {
            for (let i = 0; i < this.buttons.length; i++) {
                const rect = buttonRects[i];
                if (
                    rect.left < evt.event.clientX &&
                    evt.event.clientX < rect.right &&
                    rect.top < evt.event.clientY &&
                    evt.event.clientY < rect.bottom
                ) {
                    this.activeIndex = i;
                    break;
                }
            }
            evt.event.stopPropagation();
            evt.event.preventDefault();
        };
        this.dragHandler.onDragEnd = (evt: DragHandlerEvent) => {
            const button = this.buttons[this._activeIndex];
            if (button && button.tapHandler.onTap) {
                button.tapHandler.onTap();
            }
            evt.event.stopPropagation();
            evt.event.preventDefault();
        };
    }

    addButton(key: NavBarItems, button: Button) {
        const li = createElement("li", null, this.listElement);
        li.appendChild(button.element);
        this.listItemElements.push(li);
        this.buttons.push(button);
        this.buttonKeys.push(key);
    }

    set activeIndex(index: number) {
        if (this._activeIndex != index) {
            for (let i = 0; i < this.buttons.length; i++) {
                this.listItemElements[i].classList.toggle("active", index == i);
            }
            this._activeIndex = index;
        }
    }

    set activeKey(key: NavBarItems) {
        const index = this.buttonKeys.indexOf(key);
        if (index != -1) {
            this.activeIndex = index;
        }
    }

    destroy() {
        for (const button of this.buttons) {
            button.destroy();
        }
        this.listeners.removeAll();
        this.dragHandler.destroy();
    }

    show() {
        if (!this._visible) {
            this._visible = true;
            this.element.classList.remove("disappear", "hidden");
            this.element.classList.add("appear");
        }
    }

    hide() {
        if (this._visible) {
            this._visible = false;
            this.element.classList.remove("appear");
            this.element.classList.add("disappear");
        }
    }
}
