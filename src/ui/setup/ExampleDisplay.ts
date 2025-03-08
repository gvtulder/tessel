import { Atlas } from "../../grid/Atlas";
import { CentricGridBuilder } from "../../grid/GridBuilder";
import { GridColoring } from "../../grid/GridColoring";
import { seedPRNG } from "../../geom/RandomSampler";
import { RuleSet } from "../../grid/RuleSet";
import { ColorPattern } from "../../grid/Shape";
import { TileColors } from "../../grid/Tile";
import { GridDisplay } from "../grid/GridDisplay";
import { createElement } from "../html";

export class ExampleDisplay {
    element: HTMLDivElement;
    gridDisplay?: ExampleGridDisplay;

    constructor() {
        this.element = createElement("div", "exampleGrid");
    }

    showAtlas(
        atlas: Atlas,
        colors: TileColors,
        colorPattern: ColorPattern,
        rules: RuleSet,
    ) {
        if (this.gridDisplay) {
            this.gridDisplay.element.remove();
            this.gridDisplay.destroy();
            this.gridDisplay = undefined;
        }

        const seed = 123456;
        const prngShape = seedPRNG(seed);
        const prngColorGroup = seedPRNG(seed);
        const prngColor = seedPRNG(seed);

        const grid = new CentricGridBuilder().buildGrid(atlas, 30, prngShape);
        grid.rules = rules;
        const coloring = new GridColoring(grid);
        coloring.applyColorPattern(
            new Map([[grid.atlas.shapes[0], [colorPattern]]]),
            prngColorGroup,
        );
        coloring.assignColors(colors, prngColor);

        const gridDisplay = new ExampleGridDisplay(grid, this.element);
        this.gridDisplay = gridDisplay;
        this.element.appendChild(gridDisplay.element);
        this.gridDisplay.rescale();
    }

    rescale() {
        if (this.gridDisplay) {
            this.gridDisplay.rescale();
        }
    }
}

class ExampleGridDisplay extends GridDisplay {
    animated = false;

    styleMainElement() {
        const div = this.element;
        div.className = "gameSetup-gridDisplay gridDisplay";
    }
}
