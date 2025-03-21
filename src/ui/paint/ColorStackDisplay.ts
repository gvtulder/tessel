import { TileColor, TileColors } from "../../grid/Tile";
import { TapHandler } from "../shared/TapHandler";
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
            swatch.tapHandler.onTap = () => {
                this.selectSwatch(swatch);
            };
            this.element.appendChild(swatch.element);
            this.swatches.push(swatch);
        }
        const swatch = new ColorSwatch(null);
        swatch.tapHandler.onTap = () => {
            this.selectSwatch(swatch);
        };
        this.element.appendChild(swatch.element);
        this.swatches.push(swatch);
        this.currentSwatch = this.swatches[0];
        this.selectSwatch(this.swatches[0]);
    }

    selectSwatch(selected: ColorSwatch) {
        for (const swatch of this.swatches) {
            swatch.swatch.classList.toggle(
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
    swatch: HTMLDivElement;
    tapHandler: TapHandler;
    color: TileColor | null;

    constructor(color: TileColor | null) {
        this.color = color;
        const wrap = (this.element = createElement("div", "color-swatch-wrap"));
        const swatch = (this.swatch = createElement(
            "div",
            "color-swatch",
            wrap,
        ));
        if (color) {
            swatch.style.background = color;
        } else {
            swatch.classList.add("color-swatch-remove");
            swatch.innerHTML = icons.eraserIcon;
        }
        this.tapHandler = new TapHandler(wrap);
    }

    destroy() {
        this.element.remove();
        this.tapHandler.destroy();
    }
}
