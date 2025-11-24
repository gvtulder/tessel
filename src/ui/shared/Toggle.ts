/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { createElement } from "./html";
import { TapHandler } from "./TapHandler";
import { t } from "@lingui/core/macro";

export class Toggle {
    static events = {
        Change: "change",
    };
    element: HTMLElement;
    private boxElement: HTMLElement;
    private _checked!: boolean;

    private onchange?: (source: Toggle) => void;
    private tapHandler: TapHandler;

    constructor(
        icon: string,
        title: MessageDescriptor,
        onchange: (source: Toggle) => void,
        checked?: Promise<boolean>,
    ) {
        const toggle = createElement("div", "game-toggle");
        this.element = toggle;

        const box = createElement("div", "toggle-box", toggle);
        createElement("div", "toggle-ball", box);
        this.boxElement = box;

        const iconEl = createElement("div", "icon", toggle);
        iconEl.innerHTML = icon;
        iconEl.title = t(title);

        this.onchange = onchange;
        if (checked) {
            checked.then((value: boolean) => (this.checked = value));
        }

        this.tapHandler = new TapHandler(toggle);
        this.tapHandler.onTap = () => {
            this.toggle();
        };
    }

    destroy() {
        this.onchange = undefined;
        this.tapHandler.destroy();
        this.element.remove();
    }

    get checked(): boolean {
        return this._checked;
    }

    set checked(state: boolean) {
        this.element.classList.toggle("enabled", state);
        if (this._checked != state) {
            this._checked = state;
            if (this.onchange) this.onchange(this);
        }
    }

    toggle() {
        this.checked = !this.checked;
    }

    set label(label: string) {
        // makes this a labeled toggle
        this.element.classList.add("with-label");
        const span = createElement("span", "label", this.element);
        span.innerHTML = label;
    }
}
