/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { createElement } from "./html";
import { TapHandler } from "./TapHandler";

export class Toggle {
    static events = {
        Change: "change",
    };
    element: HTMLElement;
    private _checked!: boolean;

    private onchange: (source: Toggle) => void;
    private tapHandler: TapHandler;

    constructor(
        icon: string,
        title: string,
        onchange: (source: Toggle) => void,
        checked?: Promise<boolean>,
    ) {
        const toggle = createElement("div", "game-toggle");
        this.element = toggle;

        const box = createElement("div", "toggle-box", toggle);
        createElement("div", "toggle-ball", box);

        const iconEl = createElement("div", "icon", toggle);
        iconEl.innerHTML = icon;

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
        this.element.remove();
        this.tapHandler.destroy();
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
}
