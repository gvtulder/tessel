import { DragHandler, DragHandlerEvent } from "./DragHandler";

export class Button {
    element: HTMLElement;
    interactable: DragHandler;

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
        this.interactable = new DragHandler(button);
        this.interactable.onTap = (evt: DragHandlerEvent) => ontap(evt.event);
    }

    destroy() {
        // TODO
        // this.interactable.unset();
        this.element.remove();
    }
}
