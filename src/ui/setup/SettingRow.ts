/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { getStorageBackend } from "../../lib/storage-backend";
import { createElement } from "../shared/html";
import { SettingRowOption } from "./SettingRowOption";
import { t } from "@lingui/core/macro";

export class SettingRow<T extends SettingRowOption> {
    element: HTMLDivElement;
    optionWrapElement: HTMLDivElement;
    dropdownWrapElement: HTMLDivElement;
    dropdownElement: HTMLDivElement;
    currentOption?: T;
    options: T[];
    onchange?: () => void;
    _selected?: number;
    localStorageKey: string;
    backgroundEventHandler: (evt: PointerEvent) => void;

    constructor(
        className: string,
        localStorageKey: string,
        title: MessageDescriptor,
    ) {
        this.element = createElement("div", `setting-row ${className}`);
        this.localStorageKey = localStorageKey;
        this.options = [];

        // title
        const header = createElement("h3", null, this.element);
        header.innerHTML = t(title);

        // options dropdown
        this.optionWrapElement = createElement(
            "div",
            "option-wrap",
            this.element,
        );
        this.dropdownWrapElement = createElement(
            "div",
            "dropdown-wrap",
            this.optionWrapElement,
        );
        this.dropdownElement = createElement(
            "div",
            "dropdown",
            this.dropdownWrapElement,
        );

        this.backgroundEventHandler = (evt: PointerEvent) => {
            const target = evt.target as HTMLElement;
            if (
                !target.closest ||
                (target.closest(".setting-row-option") !==
                    this.currentOption?.element &&
                    target.closest(".dropdown") !== this.dropdownElement)
            ) {
                this.close();
            }
        };
        window.addEventListener("pointerdown", this.backgroundEventHandler);
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
        this.dropdownElement.appendChild(option.element);
        const index = this.options.length;
        this.options.push(option);
        option.tappable.onStartPress = () => {
            this.selectedIndex = index;
            const selectedKey = this.selected && this.selected.key;
            if (selectedKey) {
                getStorageBackend().setItem(this.localStorageKey, selectedKey);
            }
            if (this.onchange) {
                this.onchange();
            }
            this.toggleOpen();
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

    toggleOpen(state?: boolean) {
        this.element.classList.toggle("open", state);
        if (this.element.classList.contains("open")) {
            const upward =
                window.innerHeight -
                    this.element.getBoundingClientRect().bottom <
                this.dropdownElement.scrollHeight;
            this.element.classList.toggle("upward", upward);
        } else {
            this.element.classList.toggle("upward", false);
        }
        this.rescale();
    }

    open() {
        this.toggleOpen(true);
    }

    close() {
        this.toggleOpen(false);
    }

    async selectStoredOrDefault(defaultKey?: string) {
        const storedKey = await getStorageBackend().getItem(
            this.localStorageKey,
        );
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
        if (this.currentOption) {
            this.currentOption.rescale();
        }
    }

    destroy() {
        for (const option of this.options) {
            option.destroy();
        }
        if (this.currentOption) {
            this.currentOption.destroy();
        }
        this.element.remove();
        window.removeEventListener("pointerdown", this.backgroundEventHandler);
    }

    private updateSelectedState() {
        const options = this.options;
        for (let i = 0; i < options.length; i++) {
            options[i].element.classList.toggle(
                "selected",
                i == this._selected,
            );
        }
        if (this.currentOption) {
            this.currentOption.destroy();
        }
        this.currentOption = options[
            this._selected || 0
        ].cloneForDisplay() as T;
        this.currentOption.element.classList.add("current");
        this.optionWrapElement.appendChild(this.currentOption.element);
        this.currentOption.rescale();
        this.currentOption.tappable.onStartPress = () => {
            this.toggleOpen();
        };
        this.currentOption.element.classList.add("changed");
    }
}
