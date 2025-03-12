import { createElement } from "../shared/html";
import { DragHandler } from "../shared/DragHandler";

export abstract class SettingRowOption {
    key: string;
    element: HTMLDivElement;
    draggable: DragHandler;

    constructor(key: string) {
        this.key = key;
        this.element = createElement("div", "setting-row-option");
        this.draggable = new DragHandler(this.element);
    }

    rescale() {}

    destroy() {
        this.element.remove();
        this.draggable.destroy();
    }
}
