import type { Interactable, PointerEvent } from "@interactjs/types";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";
import { createElement } from "../html";

export class Toggle {
    static events = {
        Change: "change",
    };
    element: HTMLElement;
    private _checked!: boolean;

    private onchange: () => void;
    private interactable: Interactable;

    constructor(
        icon: string,
        title: string,
        onchange: () => void,
        checked?: boolean,
    ) {
        const toggle = createElement("div", "game-toggle");
        this.element = toggle;

        const box = createElement("div", "toggle-box", toggle);
        createElement("div", "toggle-ball", box);

        const iconEl = createElement("div", "icon", toggle);
        iconEl.innerHTML = icon;

        this.checked = checked ? true : false;
        this.onchange = onchange;

        this.interactable = interact(toggle).on("tap", () => {
            this.toggle();
        });
    }

    destroy() {
        this.interactable.unset();
        this.element.remove();
    }

    get checked(): boolean {
        return this._checked;
    }

    set checked(state: boolean) {
        this.element.classList.toggle("enabled", state);
        if (this._checked != state) {
            this._checked = state;
            if (this.onchange) this.onchange();
        }
    }

    toggle() {
        this.checked = !this.checked;
    }
}
