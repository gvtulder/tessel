/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import * as zod from "zod/v4-mini";
import { Grid, TileSet_S } from "../grid/Grid";
import { ScoredRegion, Scorer, ScorerType } from "./scorers/Scorer";
import { ConnectedSegmentScorer } from "./scorers/ConnectedSegmentScorer";
import { Tile, TileColors } from "../grid/Tile";
import { TileGenerator, TileGenerators } from "./TileGenerator";
import { TileShapeColors, TileStack } from "./TileStack";
import { TileStackWithSlots } from "./TileStackWithSlots";
import { TileStackWithSlots_S } from "./TileStackWithSlots_S";
import { Atlas } from "../grid/Atlas";
import { rotateArray } from "../geom/arrays";
import { RuleSetType } from "../grid/rules/RuleSet";
import { ColorPatternPerShape } from "../grid/Shape";
import { SetupCatalog } from "../saveGames";
import { PRNG, seedPRNG, shuffle } from "../geom/RandomSampler";
import {
    DemoGameInitializer,
    DemoGameSettings,
    GameInitializer,
} from "./GameInitializer";
import { SourceGrid } from "../grid/SourceGrid";
import { StatisticsMonitor } from "../stats/StatisticsMonitor";
import { StatisticsEvent } from "../stats/Events";
import { Command } from "../commands/Command";
import { CommandHistory } from "../commands/CommandHistory";

export type GameSettings = {
    serializedJSON?: string;
    atlas: Atlas;
    colors?: TileColors;
    rules?: RuleSetType;
    scorer?: ScorerType;
    colorPatternPerShape?: ColorPatternPerShape;
    uniqueTileColors?: boolean;
    tilesShownOnStack: number;
    initialTile: TileColors;
    tileGenerator: TileGenerator[];
    gameInitializer?: GameInitializer;
    seed?: number;
};

export type GameSettingsSerialized = {
    atlas: string;
    colors: string;
    segments: number;
    uniqueTileColors: boolean;
    rules: string;
    scorer: string;
    demoGame?: DemoGameSettings;
    seed?: number;
};

export function serializedToJSON(settings: GameSettingsSerialized): string {
    return JSON.stringify(settings, [
        "atlas",
        "colors",
        "segments",
        "uniqueTileColors",
        "rules",
        "scorer",
        "demoGame",
    ]);
}

export const GameState_S = zod.object({
    points: zod.number(),
    continued: zod.boolean(),
    tileStack: TileStackWithSlots_S,
    tiles: TileSet_S,
    sourceGrid: zod.optional(zod.unknown()),
});
export type GameState_S = zod.infer<typeof GameState_S>;

export const enum GameEventType {
    EndGame = "endgame",
    ContinueGame = "continuegame",
    Score = "score",
    Points = "points",
    UpdateTileCount = "updatetilecount",
    UpdateSlots = "updateslots",
    PlaceTile = "placetile",
    UpdateCommandHistory = "updatecommandhistory",
}

export class GameEvent extends Event {
    game?: Game;
    scoreShapes?: ScoredRegion[];
    tile?: Tile;

    constructor(
        type: GameEventType,
        game?: Game | null,
        scoreShapes?: ScoredRegion[] | null,
        tile?: Tile | null,
    ) {
        super(type);
        this.game = game || undefined;
        this.scoreShapes = scoreShapes || undefined;
        this.tile = tile || undefined;
    }
}

export class Game extends EventTarget {
    settings: GameSettings;

    stats?: StatisticsMonitor;

    grid: Grid;
    scorer: Scorer;
    tileStack: TileStackWithSlots;

    points: number;
    continued: boolean;

    history: CommandHistory;

    constructor(settings: GameSettings, prng?: PRNG, restoreState?: unknown) {
        super();

        if (!prng && settings.seed) prng = seedPRNG(settings.seed);

        this.settings = settings;
        this.history = new CommandHistory(() =>
            this.dispatchEvent(
                new GameEvent(GameEventType.UpdateCommandHistory, this),
            ),
        );

        let state = null;
        let sourceGrid = undefined;
        if (restoreState) {
            try {
                state = GameState_S.parse(restoreState);
                if (state.sourceGrid && this.settings.atlas.sourceGrid) {
                    sourceGrid = this.settings.atlas.sourceGrid.restore(
                        state.sourceGrid,
                    );
                }
            } catch (err) {
                console.log(err);
                // continue with default initialization
            }
        }

        this.grid = new Grid(this.settings.atlas, undefined, sourceGrid);
        if (settings.rules) this.grid.rules = settings.rules.create();
        this.scorer = (settings.scorer || ConnectedSegmentScorer).create();

        if (state) {
            this.points = state.points;
            this.continued = state.continued;
            this.tileStack = TileStackWithSlots.restore(
                state.tileStack,
                this.grid.atlas.shapes,
            );
            this.grid.restoreTiles(state.tiles);
            return;
        }

        this.points = 0;
        this.continued = false;

        // generate tiles
        let tiles: TileShapeColors[] = [];
        for (const tileGenerator of this.settings.tileGenerator) {
            tiles = tileGenerator(
                tiles,
                this.settings.atlas.shapes[0],
                undefined,
                prng,
            );
        }
        shuffle(tiles, prng);

        // construct the tile stack
        const tileStack = new TileStack(tiles, prng);
        this.tileStack = new TileStackWithSlots(
            tileStack,
            this.settings.tilesShownOnStack,
            prng,
        );

        // initialize grid with some tiles
        if (this.settings.gameInitializer) {
            this.settings.gameInitializer.initializeGame(this);
        } else {
            // use the default initial tile
            const initialTileColors = this.settings.initialTile;
            const tile = this.grid.addInitialTile();
            tile.colors = initialTileColors;
            this.tileStack.removeColors({
                shape: tile.shape,
                colors: tile.colors,
            });
        }

        this.grid.generatePlaceholders();
    }

    saveState(): GameState_S {
        return {
            points: this.points,
            continued: this.continued,
            tileStack: this.tileStack.save(this.grid.atlas.shapes),
            tiles: this.grid.saveTilesAndPlaceholders(),
            sourceGrid: this.grid.sourceGrid?.save(),
        };
    }

    undo(): boolean {
        return this.history.undo();
    }

    redo(): boolean {
        return this.history.redo();
    }

    static Continue = class extends Command {
        game: Game;

        memo?: { continued: boolean; commands: Command[] };

        constructor(game: Game) {
            super();
            this.game = game;
        }

        execute(): void {
            const game = this.game;
            this.memo = { continued: game.continued, commands: [] };
            game.continued = true;
            this.memo.commands.push(game.tileStack.restart());
            game.dispatchEvent(new GameEvent(GameEventType.ContinueGame, game));
        }

        undo(): void {
            if (!this.memo) return;
            this.game.continued = this.memo.continued;
            for (const command of this.memo.commands) {
                command.undo();
            }
            if (this.game.tileStack.isEmpty()) {
                this.game.dispatchEvent(
                    new GameEvent(GameEventType.EndGame, this.game),
                );
            }
            this.memo = undefined;
        }
    };

    continue() {
        const command = new Game.Continue(this);
        command.execute();
        this.history.push(command);
    }

    static RotateTileStack = class extends Command {
        tileStack: TileStackWithSlots;
        reverse: boolean;

        constructor(tileStack: TileStackWithSlots, reverse?: boolean) {
            super();
            this.tileStack = tileStack;
            this.reverse = !!reverse;
        }

        execute() {
            this.tileStack.rotate(this.reverse);
        }

        undo() {
            this.tileStack.rotate(!this.reverse);
        }
    };

    rotateTileStack(reverse?: boolean) {
        const command = new Game.RotateTileStack(this.tileStack, reverse);
        command.execute();
        this.history.push(command);
    }

    placeTile(
        movingTile: Tile,
        fixedTile: Tile,
        offset: number,
        indexOnStack?: number,
    ) {
        if (!movingTile.colors) {
            throw new Error("no colors defined on moving tile");
        }
        return this.placeColors(
            rotateArray(movingTile.colors, offset),
            fixedTile,
            indexOnStack,
        );
    }

    static PlaceColors = class extends Command {
        game: Game;
        colors: TileColors;
        fixedTile: Tile;
        indexOnStack: number | undefined;

        memo?: {
            tile: Tile;
            removedSlot?: TileShapeColors | null;
            endedGame?: boolean;
            commands: Command[];
        };

        constructor(
            game: Game,
            colors: TileColors,
            fixedTile: Tile,
            indexOnStack?: number,
        ) {
            super();
            this.game = game;
            this.colors = colors;
            this.fixedTile = fixedTile;
            this.indexOnStack = indexOnStack;
        }

        execute(): void {
            const game = this.game;
            const fixedTile = this.fixedTile;

            const tile = game.grid.addTile(
                fixedTile.shape,
                fixedTile.polygon,
                fixedTile.polygon.segment(),
                fixedTile.sourcePoint,
            );
            tile.colors = this.colors;

            this.memo = { tile: tile, commands: [] };

            game.grid.generatePlaceholders();

            if (this.indexOnStack !== undefined) {
                // remove from stack
                this.memo.removedSlot = game.tileStack.take(this.indexOnStack);
            }

            // compute scores and update listeners
            this.memo.commands.push(...game.computeScores(tile));
            if (game.stats) {
                this.memo.commands.push(
                    game.stats.countEvent(
                        StatisticsEvent.TilePlaced,
                        tile.shape.name.split("-")[0],
                    ),
                );
            }
            game.dispatchEvent(
                new GameEvent(GameEventType.PlaceTile, game, null, tile),
            );

            // end of game?
            if (game.tileStack.isEmpty()) {
                if (game.stats && !game.continued) {
                    this.memo.commands.push(
                        game.stats.countEvent(
                            StatisticsEvent.GameCompleted,
                            game.grid.atlas.id,
                        ),
                    );
                }
                game.dispatchEvent(new GameEvent(GameEventType.EndGame, game));
                this.memo.endedGame = true;
            }
        }

        undo(): void {
            if (!this.memo) return;

            const game = this.game;

            game.grid.removeTile(this.memo.tile);
            game.grid.generatePlaceholders();

            if (this.indexOnStack !== undefined && this.memo.removedSlot) {
                game.tileStack.putBack(
                    this.indexOnStack,
                    this.memo.removedSlot,
                );
            }

            for (const command of this.memo.commands) {
                command.undo();
            }

            if (this.memo.endedGame) {
                game.dispatchEvent(
                    new GameEvent(GameEventType.ContinueGame, game),
                );
            }

            this.memo = undefined;
        }
    };

    placeColors(colors: TileColors, fixedTile: Tile, indexOnStack?: number) {
        const matchColors = this.grid.checkColors(fixedTile, colors);
        if (matchColors) {
            const command = new Game.PlaceColors(
                this,
                colors,
                fixedTile,
                indexOnStack,
            );
            command.execute();
            this.history.push(command);
            return true;
        } else {
            // does not fit
            return false;
        }
    }

    computeScores(target: Tile): Command[] {
        const commands = [];
        const shapes = this.scorer.computeScores(this.grid, target);
        if (shapes.length > 0) {
            const points = shapes.map((s) => s.points).reduce((a, b) => a + b);

            const command = new Game.UpdatePoints(this, points);
            command.execute();
            commands.push(command);

            if (this.stats) {
                if (!this.continued) {
                    commands.push(
                        this.stats.updateHighScore(
                            StatisticsEvent.HighScore,
                            this.points,
                            this.settings.serializedJSON,
                        ),
                    );
                }
                for (const region of shapes || []) {
                    if (region.finished) {
                        commands.push(
                            this.stats.countEvent(
                                StatisticsEvent.ShapeCompleted,
                                this.settings.serializedJSON,
                            ),
                        );
                        if (region.tiles) {
                            commands.push(
                                this.stats.updateHighScore(
                                    StatisticsEvent.ShapeTileCount,
                                    region.tiles.size,
                                    this.settings.serializedJSON,
                                ),
                            );
                        }
                    }
                }
            }

            this.dispatchEvent(
                new GameEvent(GameEventType.Score, this, shapes),
            );
            this.dispatchEvent(new GameEvent(GameEventType.Points, this));
        }
        return commands;
    }

    static UpdatePoints = class extends Command {
        game: Game;
        points: number;

        constructor(game: Game, points: number) {
            super();
            this.game = game;
            this.points = points;
        }

        execute(): void {
            this.game.points += this.points;
            this.game.dispatchEvent(
                new GameEvent(GameEventType.Points, this.game),
            );
        }

        undo(): void {
            this.game.points -= this.points;
            this.game.dispatchEvent(
                new GameEvent(GameEventType.Points, this.game),
            );
        }
    };
}

export function gameFromSerializedSettings(
    catalog: typeof SetupCatalog,
    serialized: GameSettingsSerialized,
): GameSettings | null {
    const atlas = catalog.atlas.get(serialized.atlas);
    if (!atlas) return null;
    const colors = catalog.colors.get(serialized.colors);
    if (!colors) return null;
    const rules = catalog.rules.get(serialized.rules);
    if (!rules) return null;
    const scorer = catalog.scorers.get(serialized.scorer);
    if (!scorer) return null;

    const colorPatternPerShape = new ColorPatternPerShape(
        atlas.atlas.shapes.map((shape) => [
            shape,
            shape.colorPatterns[1 * serialized.segments],
        ]),
    );

    const shape = atlas.atlas.shapes[0];
    const colorPattern = colorPatternPerShape.get(shape)!;
    const initialTile = colorPattern.segmentColors[0].map(
        (c) => colors.colors[c % colors.colors.length],
    );

    const gameInitializer = serialized.demoGame
        ? new DemoGameInitializer(serialized.demoGame)
        : undefined;

    const settings: GameSettings = {
        serializedJSON: serializedToJSON(serialized),
        atlas: atlas.atlas,
        colors: colors.colors,
        rules: rules.rules,
        scorer: scorer.scorer,
        colorPatternPerShape: colorPatternPerShape,
        uniqueTileColors: serialized.uniqueTileColors,
        initialTile: initialTile,
        tilesShownOnStack: 3,
        tileGenerator: [
            TileGenerators.forShapes(
                atlas.atlas.shapes,
                [
                    TileGenerators.permutations(
                        colors.colors,
                        undefined,
                        serialized.uniqueTileColors,
                    ),
                ],
                colorPatternPerShape,
                atlas.atlas.shapeFrequencies,
            ),
            TileGenerators.ensureNumber(60, 100),
        ],
        gameInitializer: gameInitializer,
        seed: serialized.seed,
    };
    return settings;
}
