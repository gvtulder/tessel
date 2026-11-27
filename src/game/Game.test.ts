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
import { Penrose3SourceGrid } from "../grid/source/Penrose3SourceGrid";
import { TileShapeColors } from "./TileStack";
import { TileColors } from "../grid/Tile";

function normalizeTileColorsList(
    tiles: (TileShapeColors | null | undefined)[],
): string[] {
    const tileColors: string[] = [];
    for (const tile of tiles) {
        if (!tile) continue;
        let normalizedColors = tile.colors.join("-");
        for (let i = 1; i < normalizedColors.length; i++) {
            const alt = [
                ...tile.colors.slice(i, tile.colors.length),
                ...tile.colors.slice(0, i),
            ].join("-");
            if (alt.localeCompare(normalizedColors) < 0) {
                normalizedColors = alt;
            }
        }
        tileColors.push(normalizedColors);
    }
    return tileColors.sort();
}

describe("Game", () => {
    const colors = ["red", "blue", "green", "black"];
    const settings = {
        atlas: SquaresAtlas,
        initialTile: colors,
        scorer: ConnectedSegmentScorer,
        tilesShownOnStack: 3,
        tileGenerator: [TileGenerators.permutations(colors)],
    };

    test("can be created", () => {
        const game = new Game(settings);
    });

    test("can be played", () => {
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

    test.each([
        { numTiles: 200, scenario: "full tileset", expectSame: true },
        { numTiles: 30, scenario: "subset of tiles", expectSame: false },
    ])("continue game: $scenario", ({ numTiles, scenario, expectSame }) => {
        const prng = seedPRNG(1234);
        const customSettings = { ...settings };
        customSettings.tileGenerator = [
            ...customSettings.tileGenerator,
            TileGenerators.randomSubset(numTiles),
        ];
        const game = new Game(customSettings, prng);

        const initialTileSet = normalizeTileColorsList([
            ...game.tileStack.originalTileStack.tiles,
        ]);

        // simulate playing until the stack is empty
        const player = new AutoPlayer(game);
        player.playAllTiles(undefined, prng);

        expect(game.tileStack.isEmpty()).toBe(true);

        // continue game: adds more tiles
        game.continue(prng);

        const restartedTileSet = normalizeTileColorsList([
            ...game.tileStack.slots,
            ...game.tileStack.tileStack.tiles,
        ]);

        // if the number of tiles is less than the full set,
        // the tile sequence should be different to the initial sequence
        if (expectSame) {
            expect(restartedTileSet).toEqual(initialTileSet);
        } else {
            expect(restartedTileSet).not.toEqual(initialTileSet);
        }

        // attempt to undo
        game.undo();
        expect(game.tileStack.isEmpty()).toBe(true);
        game.redo();
        const redoTileSet = normalizeTileColorsList([
            ...game.tileStack.slots,
            ...game.tileStack.tileStack.tiles,
        ]);
        expect(redoTileSet).toEqual(restartedTileSet);
    });

    const atlases = [SquaresAtlas, TrianglesAtlas, Penrose3GridAtlas];
    test.each(atlases)("can be saved and restored: $id", (atlas) => {
        const prng = seedPRNG(1234);

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
        if (atlas.id == "penrose") {
            const sourceGrid = game.grid.sourceGrid as Penrose3SourceGrid;
            const sourceGrid2 = game2.grid.sourceGrid as Penrose3SourceGrid;
            expect(sourceGrid2.angles).toEqual(sourceGrid.angles);
        }
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
