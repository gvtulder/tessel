import { createElement } from "../html";
import { SettingRowOption } from "./SettingRowOption";

export class SettingRow<T extends SettingRowOption> {
    element: HTMLDivElement;
    options: T[];
    onchange?: () => void;
    _selected?: number;

    constructor() {
        this.element = createElement("div", "setting-row");
        this.options = [];
    }

    addOption(option: T) {
        this.element.appendChild(option.element);
        const index = this.options.length;
        this.options.push(option);
        option.element.addEventListener("click", () => {
            this.selectedIndex = index;
            if (this.onchange) {
                this.onchange();
            }
        });
        if (this.selectedIndex === undefined) {
            this.selectedIndex = index;
            option.element.classList.add("selected");
        }
    }

    popOption() {
        const option = this.options.pop();
        if (option) {
            option.element.remove();
            if (this.options.length <= (this._selected || 0)) {
                this._selected = 0;
            }
        }
        this.updateSelectedState();
    }

    set selectedIndex(selectedOption: number) {
        this._selected = selectedOption;
        this.updateSelectedState();
    }

    get selectedIndex(): number | undefined {
        return this._selected;
    }

    get selected(): T | undefined {
        return this._selected === undefined
            ? undefined
            : this.options[this._selected];
    }

    rescale() {
        for (const option of this.options) {
            option.rescale();
        }
    }

    destroy() {
        // TODO
    }

    private updateSelectedState() {
        const options = this.options;
        for (let i = 0; i < options.length; i++) {
            options[i].element.classList.toggle(
                "selected",
                i == this._selected,
            );
        }
    }
}
