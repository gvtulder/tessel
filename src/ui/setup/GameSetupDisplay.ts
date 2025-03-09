import { ScreenDisplay } from "../ScreenDisplay";
import { createElement } from "../html";
import {
    HexagonsAtlas,
    RhombusAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "../../grid/Atlas";
import {
    DifferentEdgeColorsRuleSet,
    MatchEdgeColorsRuleSet,
} from "../../grid/RuleSet";
import { ExampleDisplay } from "./ExampleDisplay";
import { SettingRow } from "./SettingRow";
import { SettingRowOption } from "./SettingRowOption";
import { ColorsOption } from "./ColorsOption";
import { AtlasOption } from "./AtlasOption";
import { SegmentsSettingRow } from "./SegmentsSettingRow";
import { RulesSettingRow } from "./RulesSettingRow";
import { RulesOption } from "./RulesOption";
import { Button } from "../Button";
import icons from "../icons";
import { generateSeed } from "src/geom/RandomSampler";
import { SetupCatalog } from "src/saveGames";

export class GameSetupDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    exampleDisplay: ExampleDisplay;
    settingRows: SettingRow<SettingRowOption>[];

    regenerateButton: Button;

    seed: number;
    valid: boolean;

    constructor() {
        super();

        const catalog = SetupCatalog;

        this.seed = 123456;
        this.valid = false;

        const div = (this.element = createElement("div", "gameSetupDisplay"));
        const settingsDiv = createElement("div", "settings", div);

        this.exampleDisplay = new ExampleDisplay();
        div.appendChild(this.exampleDisplay.element);

        const buttonRow = createElement("div", "button-row", this.element);
        const playButton = new Button(icons.playIcon, "Play game", () => {});
        playButton.element.classList.add("play");
        buttonRow.appendChild(playButton.element);
        this.regenerateButton = playButton;

        const regenerateButton = new Button(
            icons.rotateRightIcon,
            "Regenerate",
            () => {
                this.seed = generateSeed();
                console.log(`Regenerate with new seed: ${this.seed}`);
                update();
            },
        );
        regenerateButton.element.classList.add("regenerate");
        this.exampleDisplay.element.appendChild(regenerateButton.element);
        this.regenerateButton = regenerateButton;

        this.settingRows = [];

        const settingAtlas = new SettingRow<AtlasOption>();
        for (const { key, atlas } of catalog.atlas) {
            settingAtlas.addOption(new AtlasOption(key, atlas));
        }
        settingAtlas.select(catalog.defaultAtlas);
        settingsDiv.appendChild(settingAtlas.element);
        this.settingRows.push(settingAtlas);

        const settingColors = new SettingRow<ColorsOption>();
        for (const { key, colors } of catalog.colors) {
            settingColors.addOption(new ColorsOption(key, colors));
        }
        settingColors.select(catalog.defaultColor);
        settingsDiv.appendChild(settingColors.element);
        this.settingRows.push(settingColors);

        const settingSegments = new SegmentsSettingRow();
        settingsDiv.appendChild(settingSegments.element);
        this.settingRows.push(settingSegments);

        const settingRules = new RulesSettingRow();
        for (const { key, rules, exampleColors } of catalog.rules) {
            settingRules.addOption(new RulesOption(key, rules, exampleColors));
        }
        settingRules.select(catalog.defaultRules);
        settingsDiv.appendChild(settingRules.element);
        this.settingRows.push(settingRules);

        const update = () => {
            const atlas = settingAtlas.selected!.atlas;
            const colors = settingColors.selected!.colors;
            settingSegments.showAtlas(atlas, colors);
            settingRules.updateColors(colors);
            const colorPattern = settingSegments.selected!.colorPattern!;
            const valid = this.exampleDisplay.showAtlas(
                atlas,
                colors,
                colorPattern,
                settingRules.selected!.rules,
                this.seed,
            );
            playButton.element.classList.toggle("disabled", !valid);
            this.valid = valid;
        };

        settingColors.onchange = update;
        settingAtlas.onchange = update;
        settingSegments.onchange = update;
        settingRules.onchange = update;

        update();
    }

    destroy() {
        // TODO
        this.exampleDisplay.destroy();
        this.regenerateButton.destroy();
        for (const row of this.settingRows) {
            row.destroy();
        }
    }

    rescale() {
        // TODO
        this.exampleDisplay.rescale();
        for (const row of this.settingRows) {
            row.rescale();
        }
    }
}
