import { ScreenDisplay } from "../ScreenDisplay";
import { createElement } from "../html";
import {
    HexagonsAtlas,
    RhombusAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "../../geom/Atlas";
import {
    DifferentEdgeColorsRuleSet,
    MatchEdgeColorsRuleSet,
} from "../../geom/RuleSet";
import { ExampleDisplay } from "./ExampleDisplay";
import { SettingRow } from "./SettingRow";
import { SettingRowOption } from "./SettingRowOption";
import { ColorsOption } from "./ColorsOption";
import { AtlasOption } from "./AtlasOption";
import { SegmentsSettingRow } from "./SegmentsSettingRow";
import { RulesSettingRow } from "./RulesSettingRow";
import { RulesOption } from "./RulesOption";

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
