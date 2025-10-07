// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { createElement } from "../shared/html";
import { SettingRowOption } from "./SettingRowOption";

export class SettingRow<T extends SettingRowOption> {
    element: HTMLDivElement;
    options: T[];
    onchange?: () => void;
    _selected?: number;
    localStorageKey: string;

    constructor(className: string, localStorageKey: string) {
        this.element = createElement("div", `setting-row ${className}`);
        this.localStorageKey = localStorageKey;
        this.options = [];
    }

    private updateOptionCount() {
        for (let i = 0; i < 10; i++) {
            this.element.classList.toggle(
                `count${i}`,
                this.options.length == i,
            );
        }
    }

    addOption(option: T) {
        this.element.appendChild(option.element);
        const index = this.options.length;
        this.options.push(option);
        option.tappable.onTap = () => {
            this.selectedIndex = index;
            const selectedKey = this.selected && this.selected.key;
            if (selectedKey) {
                localStorage.setItem(this.localStorageKey, selectedKey);
            }
            if (this.onchange) {
                this.onchange();
            }
        };
        if (this.selectedIndex === undefined) {
            this.selectedIndex = index;
            option.element.classList.add("selected");
        }
        this.updateOptionCount();
    }

    popOption() {
        const option = this.options.pop();
        if (option) {
            option.element.remove();
            option.destroy();
            if (this.options.length <= (this._selected || 0)) {
                this._selected = 0;
            }
        }
        this.updateSelectedState();
        this.updateOptionCount();
    }

    set selectedIndex(selectedOption: number) {
        this._selected = selectedOption;
        this.updateSelectedState();
    }

    get selectedIndex(): number | undefined {
        return this._selected;
    }

    get selected(): T | undefined {
        return this._selected === undefined
            ? undefined
            : this.options[this._selected];
    }

    select(key: string) {
        for (let i = 0; i < this.options.length; i++) {
            if (this.options[i].key == key) {
                this.selectedIndex = i;
                return;
            }
        }
    }

    selectStoredOrDefault(defaultKey?: string) {
        const storedKey = localStorage.getItem(this.localStorageKey);
        let storedIndex: number | null = null;
        let defaultIndex: number | null = null;
        for (let i = 0; i < this.options.length; i++) {
            if (this.options[i].key == storedKey) {
                storedIndex = i + 1;
            }
            if (this.options[i].key == defaultKey) {
                defaultIndex = i + 1;
            }
        }
        console.log(
            "reset setting",
            this.localStorageKey,
            storedKey,
            storedIndex,
            defaultIndex,
        );
        this.selectedIndex = (storedIndex || defaultIndex || 1) - 1;
    }

    rescale() {
        for (const option of this.options) {
            option.rescale();
        }
    }

    destroy() {
        for (const option of this.options) {
            option.destroy();
        }
        this.element.remove();
    }

    private updateSelectedState() {
        const options = this.options;
        for (let i = 0; i < options.length; i++) {
            options[i].element.classList.toggle(
                "selected",
                i == this._selected,
            );
        }
    }
}
