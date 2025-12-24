/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { SquaresAtlas } from "../grid/atlas/SquaresAtlas";
import { TileGenerators } from "./TileGenerator";
import { Game } from "./Game";
import { AutoPlayer } from "./autoplayer/AutoPlayer";
import { seedPRNG } from "../geom/RandomSampler";
import { TrianglesAtlas } from "../grid/atlas/TrianglesAtlas";
import { Penrose3GridAtlas } from "../grid/atlas/Penrose3GridAtlas";
import { StatisticsMonitor } from "../stats/StatisticsMonitor";
import { StatisticsEvent } from "../stats/Events";
import { ConnectedSegmentScorer } from "./scorers/ConnectedSegmentScorer";

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

    test("can be played", () => {
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

        // simulate playing
        const player = new AutoPlayer(game);
        player.playAllTiles(undefined, prng);
        expect(game.points).toBe(224);

        // check for highscores
        expect(stats.counters.get(StatisticsEvent.GameCompleted)).toBe(1);
        expect(stats.counters.get(StatisticsEvent.TilePlaced)).toBe(69);
        expect(stats.counters.get(StatisticsEvent.ShapeCompleted)).toBe(61);
        expect(stats.counters.get(StatisticsEvent.ShapeTileCount)).toBe(10);
        expect(stats.counters.get(StatisticsEvent.HighScore)).toBe(224);
    });

    const atlases = [SquaresAtlas, TrianglesAtlas, Penrose3GridAtlas];
    test.each(atlases)("can be saved and restored: $id", (atlas) => {
        const prng = seedPRNG(1234);

        const colors = ["red", "blue", "green", "black"];
        const settings = {
            atlas: atlas,
            initialTile: colors,
            tilesShownOnStack: 3,
            tileGenerator: [TileGenerators.permutations(colors)],
        };
        const game = new Game(settings, prng);

        const player = new AutoPlayer(game);
        player.playOneTile(prng);
        player.playOneTile(prng);
        player.playOneTile(prng);
        expect(game.grid.tiles.size).toBe(4);

        const saved = game.saveState();

        const game2 = new Game(settings, seedPRNG(4321), saved);
        expect(game2.points).toBe(game.points);
        expect(game2.continued).toBe(game.continued);
        expect(game2.tileStack).toEqual(game.tileStack);
        expect(game2.grid.tiles.size).toBe(game.grid.tiles.size);
        expect(game2.grid.sourceGrid).toEqual(game.grid.sourceGrid);
        game2.grid.generatePlaceholders();
        expect(game2.grid.tiles.size).toBe(game.grid.tiles.size);

        expect(game2.history.history.length).toBe(3);
        game2.history.undo();
        game2.history.undo();
        game2.history.undo();
        game2.history.redo();
        game2.history.redo();
        game2.history.redo();
        expect(game2.points).toBe(game.points);
    });
});
