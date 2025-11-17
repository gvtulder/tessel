/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, test } from "@jest/globals";
import { GameDisplay } from "./GameDisplay";
import { SquaresAtlas } from "../../grid/atlas/SquaresAtlas";
import { TileGenerators } from "../../game/TileGenerator";
import { Game } from "../../game/Game";

describe("GameDisplay", () => {
    test("can be created", () => {
        const colors = ["red", "blue", "green", "black"];
        const settings = {
            atlas: SquaresAtlas,
            initialTile: colors,
            tilesShownOnStack: 3,
            tileGenerator: [TileGenerators.permutations(colors)],
        };
        const game = new Game(settings);
        const display = new GameDisplay(game);
        display.destroy();
    });
});
