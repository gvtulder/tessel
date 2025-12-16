/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { SquaresAtlas } from "../grid/atlas/SquaresAtlas";
import { TileGenerators } from "./TileGenerator";
import { Game } from "./Game";
import { AutoPlayer } from "./autoplayer/AutoPlayer";

describe("Game", () => {
    test("can be created", () => {
        const colors = ["red", "blue", "green", "black"];
        const settings = {
            atlas: SquaresAtlas,
            initialTile: colors,
            tilesShownOnStack: 3,
            tileGenerator: [TileGenerators.permutations(colors)],
        };
        const game = new Game(settings);
    });

    test("can be saved and restored", () => {
        const colors = ["red", "blue", "green", "black"];
        const settings = {
            atlas: SquaresAtlas,
            initialTile: colors,
            tilesShownOnStack: 3,
            tileGenerator: [TileGenerators.permutations(colors)],
        };
        const game = new Game(settings);

        const player = new AutoPlayer(game);
        player.playOneTile();
        player.playOneTile();
        player.playOneTile();
        expect(game.grid.tiles.size).toBe(4);

        const saved = game.saveState();

        const game2 = new Game(settings, undefined, saved);
        expect(game2.points).toBe(game.points);
        expect(game2.continued).toBe(game.continued);
        expect(game2.tileStack).toEqual(game.tileStack);
        expect(game2.grid.tiles.size).toBe(game.grid.tiles.size);
    });
});
