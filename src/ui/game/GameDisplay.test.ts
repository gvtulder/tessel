/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { GameDisplay } from "./GameDisplay";
import { SquaresAtlas } from "../../grid/atlas/SquaresAtlas";
import { TileGenerators } from "../../game/TileGenerator";
import { ConnectedSegmentScorer } from "../../game/scorers/ConnectedSegmentScorer";
import { seedPRNG } from "../../geom/RandomSampler";
import { Game } from "../../game/Game";
import { AutoPlayer } from "../../game/autoplayer/AutoPlayer";
import { StatisticsMonitor } from "../../stats/StatisticsMonitor";
import { StatisticsEvent } from "../../stats/Events";

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

    test("can show a game", () => {
        const colors = ["red", "blue", "green", "black"];
        const settings = {
            atlas: SquaresAtlas,
            initialTile: colors,
            scorer: ConnectedSegmentScorer,
            tilesShownOnStack: 3,
            tileGenerator: [TileGenerators.permutations(colors)],
        };
        const prng = seedPRNG(1234);
        const stats = new StatisticsMonitor();

        const game = new Game(settings, prng);
        game.stats = stats;

        // simulate playing a game
        const display = new GameDisplay(game);
        const player = new AutoPlayer(game);
        player.playAllTiles(undefined, prng);
        expect(display.scoreDisplay.scoreField.innerHTML).toBe("224");
        expect(display.element.classList.contains("game-finished")).toBe(true);

        // check for highscores
        expect(stats.counters.get(StatisticsEvent.GameCompleted)).toBe(1);
        expect(stats.counters.get(StatisticsEvent.TilePlaced)).toBe(69);
        expect(stats.counters.get(StatisticsEvent.ShapeCompleted)).toBe(61);
        expect(stats.counters.get(StatisticsEvent.ShapeTileCount)).toBe(10);
        expect(stats.counters.get(StatisticsEvent.HighScore)).toBe(224);
    });
});
