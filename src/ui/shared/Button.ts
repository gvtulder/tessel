/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { TapHandler, TapHandlerEvent } from "./TapHandler";
import { t } from "@lingui/core/macro";
import { createElement } from "./html";

export class Button {
    element: HTMLElement;
    tapHandler: TapHandler;

    constructor(
        icon: string,
        title: MessageDescriptor | string,
        ontap: (evt: PointerEvent) => void,
        className?: string | null,
        showLabel?: boolean,
    ) {
        const wrapper = createElement("div", "game-button");
        if (className) wrapper.classList.add(className);
        const button = createElement("div", "bg", wrapper);
        button.title = (title as MessageDescriptor).id
            ? t(title as MessageDescriptor)
            : (title as string);
        button.innerHTML = icon;
        if (showLabel) {
            const span = createElement("span", null, button);
            span.innerHTML = button.title;
        }
        this.element = wrapper;

        const tapHandler = (this.tapHandler = new TapHandler(wrapper));
        tapHandler.onTap = (evt: TapHandlerEvent) => {
            button.classList.remove("game-button-pressed");
            ontap(evt.event);
        };
        tapHandler.onStartPress = (evt: TapHandlerEvent) => {
            wrapper.classList.add("game-button-pressed");
        };
        tapHandler.onEndPress = (evt: TapHandlerEvent) => {
            wrapper.classList.remove("game-button-pressed");
        };
    }

    destroy() {
        this.tapHandler.destroy();
        this.element.remove();
    }
}
