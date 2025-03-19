import { TileColor, TileColors } from "../../grid/Tile";
import { DragHandler } from "../shared/DragHandler";
import { createElement } from "../shared/html";
import icons from "../shared/icons";
import { PaintDisplay } from "./PaintDisplay";

export class ColorStackDisplay {
    paintDisplay: PaintDisplay;
    element: HTMLDivElement;
    swatches: ColorSwatch[];
    currentSwatch: ColorSwatch;

    constructor(paintDisplay: PaintDisplay, colors: TileColors) {
        this.paintDisplay = paintDisplay;
        this.element = createElement("div", "color-stack");

        this.swatches = [];
        for (const color of colors) {
            const swatch = new ColorSwatch(color);
            swatch.dragHandler.onTap = () => {
                this.selectSwatch(swatch);
            };
            this.element.appendChild(swatch.element);
            this.swatches.push(swatch);
        }
        const swatch = new ColorSwatch(null);
        swatch.dragHandler.onTap = () => {
            this.selectSwatch(swatch);
        };
        this.element.appendChild(swatch.element);
        this.swatches.push(swatch);
        this.currentSwatch = this.swatches[0];
        this.selectSwatch(this.swatches[0]);
    }

    selectSwatch(selected: ColorSwatch) {
        for (const swatch of this.swatches) {
            swatch.element.classList.toggle(
                "color-swatch-selected",
                swatch === selected,
            );
            if (swatch === selected) {
                this.currentSwatch = swatch;
            }
        }
    }

    get currentColor(): TileColor | null {
        return this.currentSwatch.color;
    }

    destroy() {
        this.element.remove();
        for (const swatch of this.swatches) {
            swatch.destroy();
        }
    }
}

class ColorSwatch {
    element: HTMLDivElement;
    dragHandler: DragHandler;
    color: TileColor | null;

    constructor(color: TileColor | null) {
        this.color = color;
        const swatch = createElement("div", "color-swatch");
        if (color) {
            swatch.style.background = color;
        } else {
            swatch.classList.add("color-swatch-remove");
            swatch.innerHTML = icons.eraserIcon;
        }
        this.element = swatch;
        this.dragHandler = new DragHandler(swatch);
    }

    destroy() {
        this.element.remove();
        this.dragHandler.destroy();
    }
}
