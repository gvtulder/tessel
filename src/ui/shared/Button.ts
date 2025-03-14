import { TapHandler, TapHandlerEvent } from "./TapHandler";

export class Button {
    element: HTMLElement;
    tapHandler: TapHandler;

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

        const tapHandler = (this.tapHandler = new TapHandler(button));
        tapHandler.onTap = (evt: TapHandlerEvent) => ontap(evt.event);
    }

    destroy() {
        this.element.remove();
        this.tapHandler.destroy();
    }
}
