/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { TapHandler, TapHandlerEvent } from "./TapHandler";
import { t } from "@lingui/core/macro";

export class Button {
    element: HTMLElement;
    tapHandler: TapHandler;

    constructor(
        icon: string,
        title: MessageDescriptor | string,
        ontap: (evt: PointerEvent) => void,
        className?: string,
    ) {
        const button = document.createElement("div");
        button.classList.add("game-button");
        if (className) button.classList.add(className);
        button.title = (title as MessageDescriptor).id
            ? t(title as MessageDescriptor)
            : (title as string);
        button.innerHTML = icon;
        this.element = button;

        const tapHandler = (this.tapHandler = new TapHandler(button));
        tapHandler.onTap = (evt: TapHandlerEvent) => {
            button.classList.remove("game-button-pressed");
            ontap(evt.event);
        };
        tapHandler.onStartPress = (evt: TapHandlerEvent) => {
            button.classList.add("game-button-pressed");
        };
        tapHandler.onEndPress = (evt: TapHandlerEvent) => {
            button.classList.remove("game-button-pressed");
        };
    }

    destroy() {
        this.element.remove();
        this.tapHandler.destroy();
    }
}
