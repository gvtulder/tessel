import type { Interactable, PointerEvent } from "@interactjs/types";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";

export class Button {
    element: HTMLElement;
    interactable: Interactable;

    constructor(
        icon: string,
        title: string,
        ontap: (evt: PointerEvent) => void,
    ) {
        const button = document.createElement("div");
        button.className = "game-button";
        button.title = title;
        button.innerHTML = icon;
        this.element = button;
        this.interactable = interact(button).on("tap", ontap);
    }

    destroy() {
        this.interactable.unset();
        this.element.remove();
    }
}
