import type { Interactable, PointerEvent } from "@interactjs/types";

import { Button } from "../Button";
import { createElement } from "../html";
import icons from "../icons";
import { Toggle } from "./Toggle";
import interact from "interactjs";

export class DropoutMenu {
    element: HTMLDivElement;
    dropoutButton: Button | Toggle;
    buttons: (Button | Toggle)[];
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

        this.backgroundEvent = interact(document.body);
        this.backgroundEvent.on("down", (evt: PointerEvent) => {
            const target = evt.target as HTMLElement;
            if (!target.closest || !target.closest(".dropout-menu")) {
                this.element.classList.remove("expanded");
            }
        });

        this.buttons = [];
    }

    addButton(button: Button | Toggle) {
        this.element.appendChild(button.element);
        this.buttons.push(button);
    }

    destroy() {
        for (const button of this.buttons) {
            button.destroy();
        }
        this.dropoutButton.destroy();
        this.backgroundEvent.unset();
    }
}
