/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { createElement } from "../shared/html";
import { TapHandler } from "../shared/TapHandler";

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

    set title(title: string) {
        this.element.title = title;
        this.header.innerHTML = title;
    }

    abstract cloneForDisplay(): ThisType<this>;

    rescale() {}

    destroy() {
        this.element.remove();
        this.tappable.destroy();
    }
}
