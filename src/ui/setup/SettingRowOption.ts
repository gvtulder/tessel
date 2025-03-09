import type { Interactable, PointerEvent } from "@interactjs/types";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";
import { createElement } from "../html";

export abstract class SettingRowOption {
    key: string;
    element: HTMLDivElement;
    interactable: Interactable;

    constructor(key: string) {
        this.key = key;
        this.element = createElement("div", "setting-row-option");
        this.interactable = interact(this.element);
    }

    rescale() {}

    destroy() {
        this.interactable.unset();
    }
}
