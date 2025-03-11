import type { Interactable, PointerEvent } from "@interactjs/types";

import { Button } from "../Button";
import { createElement } from "../html";
import icons from "../icons";
import { Toggle } from "./Toggle";
import interact from "interactjs";

export class DropoutMenu {
    element: HTMLDivElement;
    container: HTMLDivElement;
    dropoutButton: Button | Toggle;
    buttons: Button[];
    toggles: Toggle[];
    backgroundEvent: Interactable;

    constructor() {
        this.element = createElement("div", "dropout-menu");

        const dropoutButton = new Button(
            icons.barsIcon,
            "Show menu",
            (evt: PointerEvent) => {
                this.element.classList.toggle("expanded");
            },
        );
        dropoutButton.element.classList.add("dropout");
        this.dropoutButton = dropoutButton;
        this.element.appendChild(dropoutButton.element);

        this.container = createElement("div", "items", this.element);

        this.backgroundEvent = interact(document.body);
        this.backgroundEvent.on("down", (evt: PointerEvent) => {
            const target = evt.target as HTMLElement;
            if (!target.closest || !target.closest(".dropout-menu")) {
                this.element.classList.remove("expanded");
            }
        });

        this.buttons = [];
        this.toggles = [];
    }

    addButton(button: Button) {
        this.container.appendChild(button.element);
        this.buttons.push(button);
    }

    addToggle(toggle: Toggle) {
        this.container.appendChild(toggle.element);
        this.toggles.push(toggle);
    }

    destroy() {
        for (const button of this.buttons) {
            button.destroy();
        }
        for (const toggle of this.toggles) {
            toggle.destroy();
        }
        this.dropoutButton.destroy();
        this.backgroundEvent.unset();
    }
}
