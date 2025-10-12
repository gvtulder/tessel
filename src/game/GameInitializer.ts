/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Game } from "./Game";
import { CentricGridBuilder } from "../grid/GridBuilder";
import { GridColoring } from "../grid/GridColoring";
import { seedPRNG } from "../geom/RandomSampler";

export interface GameInitializer {
    initializeGame(game: Game): void;
}

export type DemoGameSettings = {
    seed: number;
    numberOfTiles: number;
    tileCenterWeight?: number;
    points?: number;
};

export class DemoGameInitializer implements GameInitializer {
    settings: DemoGameSettings;

    constructor(settings: DemoGameSettings) {
        this.settings = settings;
    }

    initializeGame(game: Game): void {
        const prngShape = seedPRNG(this.settings.seed);
        const prngColorGroup = seedPRNG(this.settings.seed);
        const prngColor = seedPRNG(this.settings.seed);

        const oldGrid = game.grid;
        game.grid = new CentricGridBuilder(
            this.settings.tileCenterWeight,
        ).buildGrid(
            game.settings.atlas,
            this.settings.numberOfTiles,
            prngShape,
        );
        game.grid.rules = oldGrid.rules;
        const coloring = new GridColoring(game.grid);
        coloring.applyColorPattern(
            game.settings.colorPatternPerShape!,
            game.settings.uniqueTileColors!,
            prngColorGroup,
        );
        coloring.assignColors(game.settings.colors!, prngColor);

        if (this.settings.points) {
            game.points = this.settings.points;
        }
    }
}
