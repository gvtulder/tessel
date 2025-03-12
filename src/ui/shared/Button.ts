import { DragHandler, DragHandlerEvent } from "./DragHandler";

export class Button {
    element: HTMLElement;
    dragHandler: DragHandler;

    constructor(
        icon: string,
        title: string,
        ontap: (evt: PointerEvent) => void,
        className?: string,
    ) {
        const button = document.createElement("div");
        button.classList.add("game-button");
        if (className) button.classList.add(className);
        button.title = title;
        button.innerHTML = icon;
        this.element = button;

        const dragHandler = (this.dragHandler = new DragHandler(button));
        dragHandler.onTap = (evt: DragHandlerEvent) => ontap(evt.event);
    }

    destroy() {
        this.element.remove();
        this.dragHandler.destroy();
    }
}
