import { createElement } from "../html";

export abstract class SettingRowOption {
    key: string;
    element: HTMLDivElement;

    constructor(key: string) {
        this.key = key;
        this.element = createElement("div", "setting-row-option");
    }

    rescale() {}
}
