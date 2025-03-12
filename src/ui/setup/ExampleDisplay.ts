import { Atlas } from "../../grid/Atlas";
import { CentricGridBuilder } from "../../grid/GridBuilder";
import { GridColoring } from "../../grid/GridColoring";
import { seedPRNG } from "../../geom/RandomSampler";
import { RuleSet } from "../../grid/RuleSet";
import { ColorPattern } from "../../grid/Shape";
import { TileColors } from "../../grid/Tile";
import { GridDisplay } from "../grid/GridDisplay";
import { createElement } from "../shared/html";

export class ExampleDisplay {
    element: HTMLDivElement;
    gridDisplay?: ExampleGridDisplay;

    constructor() {
        this.element = createElement("div", "example-grid");
    }

    showAtlas(
        atlas: Atlas,
        colors: TileColors,
        colorPattern: ColorPattern,
        uniqueTileColors: boolean,
        rules: RuleSet,
        seed: number = 123456,
    ): boolean {
        if (this.gridDisplay) {
            this.gridDisplay.element.remove();
            this.gridDisplay.destroy();
            this.gridDisplay = undefined;
        }

        const prngShape = seedPRNG(seed);
        const prngColorGroup = seedPRNG(seed);
        const prngColor = seedPRNG(seed);

        const grid = new CentricGridBuilder().buildGrid(atlas, 30, prngShape);
        grid.rules = rules;
        const coloring = new GridColoring(grid);
        coloring.applyColorPattern(
            new Map([[grid.atlas.shapes[0], [colorPattern]]]),
            uniqueTileColors,
            prngColorGroup,
        );
        const valid = coloring.assignColors(colors, prngColor) !== null;

        const gridDisplay = new ExampleGridDisplay(grid, this.element);
        this.gridDisplay = gridDisplay;
        this.element.appendChild(gridDisplay.element);
        this.gridDisplay.rescale();

        return valid;
    }

    rescale() {
        if (this.gridDisplay) {
            this.gridDisplay.rescale();
        }
    }

    destroy() {
        if (this.gridDisplay) {
            this.gridDisplay.destroy();
        }
        this.element.remove();
    }
}

class ExampleGridDisplay extends GridDisplay {
    animated = false;
}
