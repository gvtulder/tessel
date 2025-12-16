/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { SquaresAtlas } from "../../grid/atlas/SquaresAtlas";
import { TileGenerators } from "../TileGenerator";
import { Game } from "../Game";
import {
    AutoPlayer,
    MaxNeighborTileSelector,
    RandomTileSelector,
} from "./AutoPlayer";
import { seedPRNG } from "../../geom/RandomSampler";
import { ConnectedSegmentScorer } from "../scorers/ConnectedSegmentScorer";

describe("AutoPlayer", () => {
    const colors = ["red", "blue", "green", "black"];
    const settings = {
        atlas: SquaresAtlas,
        initialTile: colors,
        scorer: ConnectedSegmentScorer,
        tilesShownOnStack: 3,
        tileGenerator: [TileGenerators.permutations(colors)],
    };

    test("can play a game", () => {
        const prng = seedPRNG(1234);
        const game = new Game(settings, prng);
        const player = new AutoPlayer(game);
        const tilesBefore = game.tileStack.tilesLeft;
        expect(game.points).toBe(0);
        expect(player.playOneTile(prng)).toBe(true);
        expect(game.tileStack.tilesLeft).toBe(tilesBefore - 1);
        expect(player.playOneTile(prng)).toBe(true);
        expect(game.tileStack.tilesLeft).toBe(tilesBefore - 2);
        player.playAllTiles(undefined, prng);
        expect(game.tileStack.tilesLeft).toBe(0);
        expect(player.playOneTile(prng)).toBe(false);
        expect(game.points).toBe(224);
    });

    test("can play with timeout", async () => {
        const prng = seedPRNG(1234);
        const game = new Game(settings, prng);
        const player = new AutoPlayer(game);
        await player.playAllTiles(1, prng);
        expect(game.tileStack.tilesLeft).toBe(0);
        expect(player.playOneTile(prng)).toBe(false);
        expect(game.points).toBe(224);
    });

    test("RandomTileSelector", () => {
        const prng = seedPRNG(1234);
        const game = new Game(settings, prng);
        const player = new AutoPlayer(game, new RandomTileSelector());
        player.playAllTiles(undefined, prng);
        expect(game.points).toBe(62);
    });

    test("MaxNeighborTileSelector", () => {
        const prng = seedPRNG(1234);
        const game = new Game(settings, prng);
        const player = new AutoPlayer(game, new MaxNeighborTileSelector());
        player.playAllTiles(undefined, prng);
        expect(game.points).toBe(224);
    });
});
