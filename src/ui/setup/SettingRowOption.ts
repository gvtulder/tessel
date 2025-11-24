/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { createElement } from "../shared/html";
import { TapHandler } from "../shared/TapHandler";
import { t } from "@lingui/core/macro";

export const NUMBER_TO_WORD = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
];

export abstract class SettingRowOption {
    key: string;
    element: HTMLDivElement;
    header: HTMLElement;
    tappable: TapHandler;

    constructor(key: string) {
        this.key = key;
        this.element = createElement("div", "setting-row-option");
        this.tappable = new TapHandler(this.element);

        // title
        const header = createElement("p", null, this.element);
        this.header = header;
    }

    set title(title: MessageDescriptor | string) {
        if ((title as MessageDescriptor).id) {
            title = t(title as MessageDescriptor);
        }
        this.element.title = this.header.innerHTML = title as string;
    }

    abstract cloneForDisplay(): ThisType<this>;

    rescale() {}

    destroy() {
        this.tappable.destroy();
        this.element.remove();
    }
}
