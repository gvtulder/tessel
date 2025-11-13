/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { createElement } from "./html";
import { TapHandler } from "./TapHandler";
import { t } from "@lingui/core/macro";

enum ThreeWayOption {
    OptionA = "A",
    OptionB = "B",
}
type ThreeWayValue = ThreeWayOption | null;

export class ThreeWayToggle {
    static events = {
        Change: "change",
    };
    element: HTMLElement;
    valueA: string;
    valueB: string;
    private _value!: ThreeWayValue;

    private onchange: (source: ThreeWayToggle) => void;
    private tapHandler: TapHandler;
    private tapHandlerA: TapHandler;
    private tapHandlerB: TapHandler;

    constructor(
        iconA: string,
        iconB: string,
        titleA: MessageDescriptor,
        titleB: MessageDescriptor,
        valueA: string,
        valueB: string,
        onchange: (source: ThreeWayToggle) => void,
        value: Promise<ThreeWayValue | string | null>,
    ) {
        this.valueA = valueA;
        this.valueB = valueB;

        const toggle = createElement("div", "game-toggle threeway");
        this.element = toggle;

        const wrap = createElement("div", "wrap", toggle);

        const boxA = createElement("div", "toggle-box a", wrap);
        const iconAEl = createElement("div", "toggle-ball-icon", boxA);
        iconAEl.innerHTML = iconA;
        boxA.title = t(titleA);

        const boxB = createElement("div", "toggle-box b", wrap);
        const iconBEl = createElement("div", "toggle-ball-icon", boxB);
        iconBEl.innerHTML = iconB;
        boxB.title = t(titleB);

        this.onchange = onchange;
        value.then((v) => (this.value = v));

        this.tapHandler = new TapHandler(toggle);
        this.tapHandler.onTap = () => {};
        this.tapHandlerA = new TapHandler(boxA);
        this.tapHandlerA.onTap = () => {
            this.value =
                this._value != ThreeWayOption.OptionA
                    ? ThreeWayOption.OptionA
                    : null;
        };
        this.tapHandlerB = new TapHandler(boxB);
        this.tapHandlerB.onTap = () => {
            this.value =
                this._value != ThreeWayOption.OptionB
                    ? ThreeWayOption.OptionB
                    : null;
        };
    }

    destroy() {
        this.element.remove();
        this.tapHandler.destroy();
        this.tapHandlerA.destroy();
        this.tapHandlerB.destroy();
    }

    get value(): string | null {
        if (this._value == ThreeWayOption.OptionA) return this.valueA;
        if (this._value == ThreeWayOption.OptionB) return this.valueB;
        return null;
    }

    set value(v: ThreeWayValue | string) {
        let state = null;
        if (v == ThreeWayOption.OptionA || v == this.valueA)
            state = ThreeWayOption.OptionA;
        if (v == ThreeWayOption.OptionB || v == this.valueB)
            state = ThreeWayOption.OptionB;
        this.element.classList.toggle("a", state == ThreeWayOption.OptionA);
        this.element.classList.toggle("b", state == ThreeWayOption.OptionB);
        if (this._value != v) {
            this._value = state;
            if (this.onchange) this.onchange(this);
        }
    }

    set label(label: string) {
        // makes this a labeled toggle
        this.element.classList.add("with-label");
        const span = createElement("span", "label", this.element);
        span.innerHTML = label;
    }
}
