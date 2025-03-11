import { Button } from "../Button";
import { DragHandler, DragHandlerEvent } from "../DragHandler";
import { createElement } from "../html";
import icons from "../icons";
import { Toggle } from "./Toggle";

export class DropoutMenu {
    element: HTMLDivElement;
    container: HTMLDivElement;
    dropoutButton: Button | Toggle;
    buttons: Button[];
    toggles: Toggle[];
    backgroundEventHandler: (evt: PointerEvent) => void;

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

        this.backgroundEventHandler = (evt: PointerEvent) => {
            const target = evt.target as HTMLElement;
            if (!target.closest || !target.closest(".dropout-menu")) {
                this.element.classList.remove("expanded");
            }
        };
        window.addEventListener("pointerdown", this.backgroundEventHandler);

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
        window.removeEventListener("pointerdown", this.backgroundEventHandler);
    }
}
