/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { getStorageBackend } from "../../lib/storage-backend";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { ExampleDisplay } from "./ExampleDisplay";
import { SettingRow } from "./SettingRow";
import { SettingRowOption } from "./SettingRowOption";
import { ColorsOption } from "./ColorsOption";
import { AtlasOption } from "./AtlasOption";
import { SegmentsSettingRow } from "./SegmentsSettingRow";
import { RulesSettingRow } from "./RulesSettingRow";
import { RulesOption } from "./RulesOption";
import { Button } from "../shared/Button";
import icons from "../shared/icons";
import { generateSeed } from "../../geom/RandomSampler";
import { SetupCatalog } from "../../saveGames";
import { SegmentsOption } from "./SegmentsOption";
import { GameSettingsSerialized } from "../../game/Game";
import { UserEvent, UserEventType } from "../GameController";
import { ScorerSettingRow } from "./ScorerSettingRow";
import { ScorerOption } from "./ScorerOption";
import { msg, t } from "@lingui/core/macro";

export class GameSetupDisplay extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    exampleDisplay: ExampleDisplay;
    settingRows: SettingRow<SettingRowOption>[];

    settingAtlas: SettingRow<AtlasOption>;
    settingColors: SettingRow<ColorsOption>;
    settingSegments: SettingRow<SegmentsOption>;
    settingRules: SettingRow<RulesOption>;
    settingScorer: SettingRow<ScorerOption>;

    playButton: Button;
    exitButton: Button;
    regenerateButton: Button;

    seed: number;
    valid: boolean;

    constructor() {
        super();

        const catalog = SetupCatalog;

        this.seed = 123456;
        this.valid = false;

        const div = (this.element = createElement("div", "screen game-setup"));

        const heading = createElement("h2", null, div);
        heading.innerHTML = t({ id: "ui.setup.title", message: "Custom game" });

        const settingsDiv = createElement("div", "settings", div);

        this.exampleDisplay = new ExampleDisplay();
        div.appendChild(this.exampleDisplay.element);

        this.settingRows = [];

        const settingAtlas = new SettingRow<AtlasOption>(
            "atlas",
            "setup-atlas",
            msg({
                id: "ui.setup.optionTitle.atlas",
                message: "Tiling pattern",
            }),
        );
        for (const { key, atlas } of catalog.atlas.values()) {
            settingAtlas.addOption(new AtlasOption(key, atlas));
        }
        settingAtlas.selectStoredOrDefault(catalog.defaultAtlas);
        settingsDiv.appendChild(settingAtlas.element);
        this.settingAtlas = settingAtlas;
        this.settingRows.push(settingAtlas);

        const settingColors = new SettingRow<ColorsOption>(
            "colors",
            "setup-colors",
            msg({
                id: "ui.setup.optionTitle.colors",
                message: "Number of colors",
            }),
        );
        for (const { key, colors } of catalog.colors.values()) {
            settingColors.addOption(new ColorsOption(key, colors));
        }
        settingColors.selectStoredOrDefault(catalog.defaultColor);
        settingsDiv.appendChild(settingColors.element);
        this.settingColors = settingColors;
        this.settingRows.push(settingColors);

        const settingSegments = new SegmentsSettingRow();
        settingsDiv.appendChild(settingSegments.element);
        this.settingSegments = settingSegments;
        this.settingRows.push(settingSegments);

        const settingRules = new RulesSettingRow();
        for (const { key, rules, exampleColors } of catalog.rules.values()) {
            settingRules.addOption(new RulesOption(key, rules, exampleColors));
        }
        settingRules.selectStoredOrDefault(catalog.defaultRules);
        settingsDiv.appendChild(settingRules.element);
        this.settingRules = settingRules;
        this.settingRows.push(settingRules);

        const settingScorer = new ScorerSettingRow();
        for (const { key, scorer } of catalog.scorers.values()) {
            settingScorer.addOption(new ScorerOption(key, scorer));
        }
        settingScorer.selectStoredOrDefault(catalog.defaultScorer);
        settingsDiv.appendChild(settingScorer.element);
        this.settingScorer = settingScorer;
        this.settingRows.push(settingScorer);

        const buttonRow = createElement("div", "button-row", settingsDiv);
        const playButton = new Button(
            icons.playIcon,
            msg({ id: "ui.setup.playButton", message: "Play game" }),
            () => {
                if (this.valid) {
                    this.dispatchEvent(
                        new UserEvent(
                            UserEventType.StartGameFromSetup,
                            undefined,
                            undefined,
                            this.settings,
                        ),
                    );
                }
            },
        );
        playButton.element.classList.add("play");
        buttonRow.appendChild(playButton.element);
        this.playButton = playButton;

        const exitButton = new Button(
            icons.houseIcon,
            msg({ id: "ui.menu.backToMenuButton", message: "Back to menu" }),
            () => {
                this.dispatchEvent(new UserEvent(UserEventType.BackToMenu));
            },
        );
        exitButton.element.classList.add("exit");
        div.appendChild(exitButton.element);
        this.exitButton = exitButton;

        const regenerateButton = new Button(
            icons.rotateRightIcon,
            msg({
                id: "ui.setup.regenerateExampleButton",
                message: "Regenerate",
            }),
            () => {
                this.seed = generateSeed();
                console.log(`Regenerate with new seed: ${this.seed}`);
                update();
            },
        );
        regenerateButton.element.classList.add("regenerate");
        this.exampleDisplay.element.appendChild(regenerateButton.element);
        this.regenerateButton = regenerateButton;

        const update = () => {
            const atlas = settingAtlas.selected!.atlas;
            const colors = settingColors.selected!.colors;
            settingSegments.showAtlas(atlas, colors);
            settingRules.updateColors(colors);
            const colorPatternPerShape =
                settingSegments.selected!.colorPatternPerShape!;
            const uniqueColors = settingSegments.selected!.uniqueTileColors;
            const valid = this.exampleDisplay.showAtlas(
                atlas,
                colors,
                colorPatternPerShape,
                uniqueColors,
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
        settingScorer.onchange = update;

        update();

        settingSegments.selectStoredOrDefault().then(() => update());
    }

    destroy() {
        this.exampleDisplay.destroy();
        this.playButton.destroy();
        this.exitButton.destroy();
        this.regenerateButton.destroy();
        for (const row of this.settingRows) {
            row.destroy();
        }
        this.element.remove();
    }

    rescale() {
        // TODO
        this.exampleDisplay.rescale();
        for (const row of this.settingRows) {
            row.rescale();
        }
    }

    get settings(): GameSettingsSerialized {
        return {
            atlas: this.settingAtlas.selected!.key,
            colors: this.settingColors.selected!.key,
            segments: this.settingSegments.selected!.segmentsIndex,
            uniqueTileColors: this.settingSegments.selected!.uniqueTileColors,
            rules: this.settingRules.selected!.key,
            scorer: this.settingScorer.selected!.key,
        };
    }
}
