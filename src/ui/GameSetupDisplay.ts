import { Grid, GridEdge } from "src/geom/Grid";
import { ScreenDisplay } from "./ScreenDisplay";
import { createElement } from "./html";
import {
    Atlas,
    HexagonsAtlas,
    RhombusAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "../geom/Atlas";
import { GridDisplay } from "./GridDisplay";
import { seedPRNG, RandomSampler } from "../geom/RandomSampler";
import { BBox, dist, mergeBBox, midpoint, P, TWOPI } from "../geom/math";
import { selectRandom } from "../geom/RandomSampler";
import { Tile, TileColor, TileColors } from "../geom/Tile";
import { ColorPattern } from "../geom/Shape";
import { SVG } from "./svg";
import { CentricGridBuilder } from "src/geom/GridBuilder";
import { GridColoring } from "src/geom/GridColoring";

export class GameSetupDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    exampleDisplay: ExampleDisplay;
    settingRows: SettingRow<SettingRowOption>[];

    constructor() {
        super();

        const div = (this.element = createElement("div", "gameSetupDisplay"));
        const settingsDiv = createElement("div", "settings", div);

        this.exampleDisplay = new ExampleDisplay();
        div.appendChild(this.exampleDisplay.element);

        this.settingRows = [];

        const setting1 = new SettingRow();
        setting1.addOption(new StringOption("squares"));
        setting1.addOption(new StringOption("triangles"));
        settingsDiv.appendChild(setting1.element);
        this.settingRows.push(setting1);

        const settingAtlas = new SettingRow<AtlasOption>();
        settingAtlas.addOption(new AtlasOption("squares", SquaresAtlas));
        settingAtlas.addOption(new AtlasOption("triangles", TrianglesAtlas));
        settingAtlas.addOption(new AtlasOption("rhombus", RhombusAtlas));
        settingAtlas.addOption(new AtlasOption("hexagon", HexagonsAtlas));
        settingsDiv.appendChild(settingAtlas.element);
        this.settingRows.push(settingAtlas);

        const settingColors = new SettingRow<ColorsOption>();
        settingColors.addOption(
            new ColorsOption("default4", [
                "#00c0ef",
                "#dd4b39",
                "#f39c12",
                "#00a65a",
            ]),
        );
        settingColors.addOption(
            new ColorsOption("default3", ["#dd4b39", "#f39c12", "#00a65a"]),
        );
        settingColors.addOption(
            new ColorsOption("default2", ["#dd4b39", "#f39c12"]),
        );
        for (const n of [6, 5, 4, 3, 2]) {
            settingColors.addOption(
                new ColorsOption(
                    `wong${n}`,
                    [
                        "#D55E00",
                        "#E69F00",
                        "#009E73",
                        "#0072B2",
                        "#56B4E9",
                        "#CC79A7",
                    ].filter((_, i) => i < n),
                ),
            );
        }
        settingColors.addOption(
            new ColorsOption("rbkw", ["red", "blue", "black", "white"]),
        );
        settingsDiv.appendChild(settingColors.element);
        this.settingRows.push(settingColors);

        const settingSegments = new SegmentsSettingRow();
        settingsDiv.appendChild(settingSegments.element);
        this.settingRows.push(settingSegments);

        const update = () => {
            const atlas = settingAtlas.selected!.atlas;
            const colors = settingColors.selected!.colors;
            settingSegments.showAtlas(atlas, colors);
            const colorPattern = settingSegments.selected!.colorPattern!;
            this.exampleDisplay.showAtlas(atlas, colors, colorPattern);
        };

        settingColors.onchange = update;
        settingAtlas.onchange = update;
        settingSegments.onchange = update;

        update();
    }

    destroy() {
        // TODO
    }

    rescale() {
        // TODO
        this.exampleDisplay.rescale();
        for (const row of this.settingRows) {
            row.rescale();
        }
    }
}

class ExampleDisplay {
    element: HTMLDivElement;
    gridDisplay?: ExampleGridDisplay;

    constructor() {
        this.element = createElement("div", "exampleGrid");
    }

    showAtlas(atlas: Atlas, colors: TileColors, colorPattern: ColorPattern) {
        if (this.gridDisplay) {
            this.gridDisplay.element.remove();
            this.gridDisplay.destroy();
            this.gridDisplay = undefined;
        }

        console.log("showAtlas", atlas);

        const prngShape = seedPRNG() || seedPRNG(123456);
        const prngColorGroup = seedPRNG() || seedPRNG(123456);
        const prngColor = seedPRNG() || seedPRNG(123456);

        const grid = new CentricGridBuilder().buildGrid(atlas, 30, prngShape);
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

class SettingRow<T extends SettingRowOption> {
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

abstract class SettingRowOption {
    key: string;
    element: HTMLDivElement;

    constructor(key: string) {
        this.key = key;
        this.element = createElement("div", "setting-row-option");
    }

    rescale() {}
}

class StringOption extends SettingRowOption {
    constructor(key: string) {
        super(key);
        this.element.innerHTML = key;
    }
}

class ColorsOption extends SettingRowOption {
    colors: TileColors;

    constructor(key: string, colors: TileColors) {
        super(key);
        this.colors = colors;

        const palette = SVG("svg", "palette", this.element);
        let bbox: BBox = undefined!;
        for (let i = 0; i < colors.length; i++) {
            const cx = 2 * Math.cos(TWOPI * (i / colors.length + 0.125));
            const cy = 2 * Math.sin(TWOPI * (i / colors.length + 0.125));
            const r = 1.6 - 0.15 * colors.length;
            const circle = SVG("circle", null, palette);
            circle.setAttribute("fill", colors[i]);
            circle.setAttribute("cx", `${cx.toFixed(4)}`);
            circle.setAttribute("cy", `${cy.toFixed(4)}`);
            circle.setAttribute("r", `${r.toFixed(4)}`);
            bbox = mergeBBox(bbox, {
                minX: cx - r,
                minY: cy - r,
                maxX: cx + r,
                maxY: cy + r,
            });
        }
        palette.setAttribute("viewBox", "-3.5 -3.5 7 7");
        palette.setAttribute(
            "viewBox",
            [bbox.minX, bbox.minY, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY]
                .map((c) => c.toFixed(4))
                .join(" "),
        );
    }
}

const PROTO_TILE_COLOR = "#6666ff";

class AtlasOption extends SettingRowOption {
    atlas: Atlas;
    gridDisplay: GridDisplay;

    constructor(key: string, atlas: Atlas) {
        super(key);
        this.atlas = atlas;

        const grid = new Grid(atlas);
        if (grid.atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        const shape = grid.atlas.shapes[0];
        const poly = shape.constructPolygonXYR(0, 0, 1);
        const tile = grid.addTile(shape, poly, poly.segment());
        tile.colors = PROTO_TILE_COLOR;
        const gridDisplay = new OptionGridDisplay(grid, this.element);
        this.element.appendChild(gridDisplay.element);
        this.gridDisplay = gridDisplay;
    }

    rescale() {
        this.gridDisplay.rescale();
    }
}

class SegmentsSettingRow extends SettingRow<SegmentsOption> {
    constructor() {
        super();
    }

    showAtlas(atlas: Atlas, colors: TileColors) {
        if (atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        const shape = atlas.shapes[0];
        for (let i = 0; i < shape.colorPatterns.length; i++) {
            if (this.options.length <= i) {
                const option = new SegmentsOption(`${i}`);
                this.addOption(option);
            }
            this.options[i].showAtlas(atlas, colors, shape.colorPatterns[i]);
        }
        while (shape.colorPatterns.length < this.options.length) {
            this.popOption();
        }
    }
}

class SegmentsOption extends SettingRowOption {
    colorPattern?: ColorPattern;
    gridDisplay?: GridDisplay;

    constructor(key: string) {
        super(key);
    }

    showAtlas(atlas: Atlas, colors: TileColors, colorPattern: ColorPattern) {
        if (this.gridDisplay) {
            this.gridDisplay.element.remove();
            this.gridDisplay.destroy();
        }
        const grid = new Grid(atlas);
        if (atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        const shape = atlas.shapes[0];
        const poly = shape.constructPolygonXYR(0, 0, 1);
        const tile = grid.addTile(shape, poly, poly.segment());
        tile.colors = tile.segments!.map(
            (_, i) =>
                colors[
                    colorPattern.segmentColors[
                        i % colorPattern.segmentColors.length
                    ] % colors.length
                ],
        );
        const gridDisplay = new OptionGridDisplay(grid, this.element);
        this.element.appendChild(gridDisplay.element);
        this.gridDisplay = gridDisplay;
        gridDisplay.rescale();
        this.colorPattern = colorPattern;
    }

    rescale() {
        if (this.gridDisplay) {
            this.gridDisplay.rescale();
        }
    }
}

class OptionGridDisplay extends GridDisplay {
    // TODO scale based on area

    animated = true;
    margins = { top: 15, right: 15, bottom: 15, left: 15 };

    styleMainElement() {
        const div = this.element;
        div.className = "gameSetupOption-gridDisplay gridDisplay";
    }
}

class ExampleGridDisplay extends GridDisplay {
    animated = false;

    styleMainElement() {
        const div = this.element;
        div.className = "gameSetup-gridDisplay gridDisplay";
    }
}
