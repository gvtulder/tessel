import { createElement } from "../shared/html";
import { TapHandler } from "../shared/TapHandler";

export abstract class SettingRowOption {
    key: string;
    element: HTMLDivElement;
    tappable: TapHandler;

    constructor(key: string) {
        this.key = key;
        this.element = createElement("div", "setting-row-option");
        this.tappable = new TapHandler(this.element);
    }

    rescale() {}

    destroy() {
        this.element.remove();
        this.tappable.destroy();
    }
}
