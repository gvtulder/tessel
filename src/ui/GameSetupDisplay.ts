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
import {
    DifferentEdgeColorsRuleSet,
    MatchEdgeColorsRuleSet,
    RuleSet,
} from "src/geom/RuleSet";
import { Color } from "./ScoreOverlayDisplay";

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

        const settingRules = new RulesSettingRow();
        settingRules.addOption(
            new RulesOption("same", new MatchEdgeColorsRuleSet(), [0, 0]),
        );
        settingRules.addOption(
            new RulesOption(
                "different",
                new DifferentEdgeColorsRuleSet(),
                [0, 1],
            ),
        );
        settingsDiv.appendChild(settingRules.element);
        this.settingRows.push(settingRules);

        const update = () => {
            const atlas = settingAtlas.selected!.atlas;
            const colors = settingColors.selected!.colors;
            settingSegments.showAtlas(atlas, colors);
            settingRules.updateColors(colors);
            const colorPattern = settingSegments.selected!.colorPattern!;
            this.exampleDisplay.showAtlas(
                atlas,
                colors,
                colorPattern,
                settingRules.selected!.rules,
            );
        };

        settingColors.onchange = update;
        settingAtlas.onchange = update;
        settingSegments.onchange = update;
        settingRules.onchange = update;

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
                    colorPattern.segmentColors[0][
                        i % colorPattern.segmentColors[0].length
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
class RulesSettingRow extends SettingRow<RulesOption> {
    constructor() {
        super();
    }

    updateColors(colors: TileColors) {
        for (const option of this.options) {
            option.updateColors(colors);
        }
    }
}

class RulesOption extends SettingRowOption {
    rules: RuleSet;
    colorIndex: [number, number];
    segmentA: SVGPolygonElement;
    segmentB: SVGPolygonElement;

    constructor(key: string, rules: RuleSet, colorIndex: [number, number]) {
        super(key);
        this.rules = rules;
        this.colorIndex = colorIndex;

        const svg = SVG("svg", "rules", this.element);
        svg.setAttribute("viewBox", "0 0 1 1");

        // gradient
        const defs = SVG("defs", null, svg);
        const radialGradient = SVG("radialGradient", null, defs);
        radialGradient.setAttribute("id", "gradient");
        radialGradient.setAttribute("cx", "0.5");
        radialGradient.setAttribute("cy", "0.5");
        radialGradient.setAttribute("r", "0.4");
        const start = SVG("stop", null, radialGradient);
        start.setAttribute("offset", "70%");
        start.setAttribute("stop-color", "white");
        const stop = SVG("stop", null, radialGradient);
        stop.setAttribute("offset", "100%");
        stop.setAttribute("stop-color", "black");

        const g = SVG("g", null, svg);

        // segments
        const segmentA = SVG("polygon", null, g);
        segmentA.setAttribute("points", "0.1 0 1 0 1 0.9");
        this.segmentA = segmentA;
        const segmentB = SVG("polygon", null, g);
        segmentB.setAttribute("points", "0 0.1 0.9 1 0 1");
        this.segmentB = segmentB;

        // mask
        const mask = SVG("mask", null, svg);
        mask.setAttribute("id", "mask");
        const maskSquare = SVG("rect", null, mask);
        maskSquare.setAttribute("x", "0");
        maskSquare.setAttribute("y", "0");
        maskSquare.setAttribute("width", "1");
        maskSquare.setAttribute("height", "1");
        maskSquare.setAttribute("fill", "url(#gradient)");
        g.setAttribute("mask", "url(#mask)");

        // checkmark
        const checkG = SVG("g", null, svg);
        checkG.setAttribute("transform", "translate(0.70 0.7) scale(0.15)");

        // checkmark circle
        const circleBG = SVG("circle", null, mask);
        circleBG.setAttribute("cx", "0.5");
        circleBG.setAttribute("cy", "0.45");
        circleBG.setAttribute("r", "1.2");
        circleBG.setAttribute("fill", "black");
        circleBG.setAttribute("transform", "translate(0.70 0.7) scale(0.15)");

        // checkmark circle
        const circle = SVG("circle", null, checkG);
        circle.setAttribute("cx", "0.5");
        circle.setAttribute("cy", "0.45");
        circle.setAttribute("r", "1");
        circle.setAttribute("fill", Color.light);
        circle.setAttribute("stroke", Color.dark);
        circle.setAttribute("stroke-width", "0.15");

        // checkmark
        const checkmark = SVG("path", null, checkG);
        checkmark.setAttribute(
            "d",
            "M 0.87780016,0.02563948 0.35927277,0.65986061 0.12219998,0.36989528 " +
                "c -0.02795756,-0.0341881 -0.07327848,-0.0341881 -0.10123613,0 " +
                "-0.0279518,0.0341952 -0.0279518,0.0896274 0,0.12382263 " +
                "l 0.2876909,0.35187666 c 0.0139788,0.0170905 0.0322984,0.0256428 " +
                "0.050618,0.0256428 0.0183197,0 0.0366392,-0.008552 0.0506181,-0.0256428" +
                " L 0.97903606,0.149469 c 0.0279519,-0.0341952 0.0279519,-0.0896275 " +
                "0,-0.12382256 -0.0279575,-0.03419526 " +
                "-0.073284,-0.03419526 -0.1012359,0 z",
        );
        checkmark.setAttribute("fill", Color.dark);
    }

    updateColors(colors: TileColors) {
        this.segmentA.setAttribute("fill", colors[this.colorIndex[0]]);
        this.segmentB.setAttribute("fill", colors[this.colorIndex[1]]);
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
