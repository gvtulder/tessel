/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import * as zod from "zod/v4-mini";
import { Grid, TileSet_S } from "../grid/Grid";
import { Scorer, ScorerType } from "./scorers/Scorer";
import { ConnectedSegmentScorer } from "./scorers/ConnectedSegmentScorer";
import { Tile, Tile_S, TileColors } from "../grid/Tile";
import { TileGenerator, TileGenerators } from "./TileGenerator";
import {
    restoreTileShapeColors,
    saveTileShapeColors,
    TileShapeColors,
    TileShapeColors_S,
    TileStack,
} from "./TileStack";
import { TileStackWithSlots } from "./TileStackWithSlots";
import { TileStackWithSlots_S } from "./TileStackWithSlots_S";
import { Atlas } from "../grid/Atlas";
import { rotateArray } from "../geom/arrays";
import { RuleSetType } from "../grid/rules/RuleSet";
import { ColorPatternPerShape, Shape } from "../grid/Shape";
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
import { Point } from "../geom/math";
import { GameEvent, GameEventType } from "./GameEvent";

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
    undoHistory: zod.array(zod.unknown()),
    redoFuture: zod.array(zod.unknown()),
});
export type GameState_S = zod.infer<typeof GameState_S>;

const RelatedCommand_S = zod.discriminatedUnion("command", [
    StatisticsMonitor.CountEvent_S,
    StatisticsMonitor.UpdateHighScore_S,
    TileStackWithSlots.Restart_S,
]);

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

        this.grid = new Grid(this.settings.atlas, undefined, sourceGrid, prng);
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
            this.history.history = this.restoreCommands(
                state.undoHistory,
                this.grid.atlas.shapes,
            );
            this.history.future = this.restoreCommands(
                state.redoFuture,
                this.grid.atlas.shapes,
            );
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
            undoHistory: this.history.history.map((c) =>
                c.save(this.grid.atlas.shapes),
            ),
            redoFuture: this.history.future.map((c) =>
                c.save(this.grid.atlas.shapes),
            ),
        };
    }

    undo(): boolean {
        return this.history.undo();
    }

    redo(): boolean {
        return this.history.redo();
    }

    static Continue_S = zod.object({
        command: zod.literal("Game.Continue"),
        memo: zod.optional(
            zod.object({
                continued: zod.boolean(),
                commands: zod.array(RelatedCommand_S),
            }),
        ),
    });

    static Continue = class extends Command {
        game: Game;

        memo?: { continued: boolean; commands: Command[] };

        constructor(game: Game) {
            super();
            this.game = game;
        }

        execute(): void {
            const game = this.game;
            game.continued = true;
            const restartCommand = game.tileStack.restart();
            this.memo = {
                continued: game.continued,
                commands: [restartCommand],
            };
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

        save(shapeMap: Shape[]): zod.infer<typeof Game.Continue_S> {
            return {
                command: "Game.Continue",
                memo: this.memo
                    ? {
                          continued: this.memo.continued,
                          commands: this.memo.commands.map(
                              (c) =>
                                  c.save(shapeMap) as zod.infer<
                                      typeof TileStackWithSlots.Restart_S
                                  >,
                          ),
                      }
                    : undefined,
            };
        }
    };

    restoreContinueCommand(
        data: zod.infer<typeof Game.Continue_S>,
        shapeMap: readonly Shape[],
    ): Command {
        const command = new Game.Continue(this);
        if (data.memo) {
            command.memo = {
                continued: data.memo.continued,
                commands: this.restoreCommands(data.memo.commands, shapeMap),
            };
        }
        return command;
    }

    continue() {
        const command = new Game.Continue(this);
        command.execute();
        this.history.push(command);
    }

    static RotateTileStack_S = zod.object({
        command: zod.literal("Game.RotateTileStack"),
        reverse: zod.optional(zod.boolean()),
    });

    static RotateTileStack = class extends Command {
        game: Game;
        reverse: boolean;

        constructor(game: Game, reverse?: boolean) {
            super();
            this.game = game;
            this.reverse = !!reverse;
        }

        execute() {
            this.game.tileStack.rotate(this.reverse);
        }

        undo() {
            this.game.tileStack.rotate(!this.reverse);
        }

        save(shapeMap: Shape[]): zod.infer<typeof Game.RotateTileStack_S> {
            return {
                command: "Game.RotateTileStack",
                reverse: this.reverse,
            };
        }
    };

    restoreRotateTileStackCommand(
        data: zod.infer<typeof Game.RotateTileStack_S>,
        shapeMap: readonly Shape[],
    ): Command {
        return new Game.RotateTileStack(this, data.reverse);
    }

    rotateTileStack(reverse?: boolean) {
        const command = new Game.RotateTileStack(this, reverse);
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

    static PlaceColors_S = zod.object({
        command: zod.literal("Game.PlaceColors"),
        colors: zod.readonly(zod.array(zod.string())),
        fixedTile: Tile_S,
        indexOnStack: zod.optional(zod.int()),
        memo: zod.optional(
            zod.object({
                centroid: zod.object({ x: zod.number(), y: zod.number() }),
                removedSlot: zod.optional(zod.nullable(TileShapeColors_S)),
                endedGame: zod.optional(zod.boolean()),
                commands: zod.array(zod.looseObject({ command: zod.string() })),
            }),
        ),
    });

    static PlaceColors = class extends Command {
        game: Game;
        colors: TileColors;
        fixedTile: Tile;
        indexOnStack: number | undefined;

        memo?: {
            tile?: Tile;
            centroid: Point;
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

            this.memo = { tile: tile, centroid: tile.centroid, commands: [] };

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

            // if this is a restored command, we do not have the tile
            // object but only the centroid
            const tile =
                this.memo.tile || game.grid.findTileAtPoint(this.memo.centroid);
            if (!tile) return;

            game.grid.removeTile(tile);
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

        save(shapeMap: readonly Shape[]): zod.infer<typeof Game.PlaceColors_S> {
            return {
                command: "Game.PlaceColors",
                colors: this.colors,
                fixedTile: this.fixedTile.save(shapeMap),
                indexOnStack: this.indexOnStack,
                memo: this.memo
                    ? {
                          centroid: this.memo.centroid,
                          removedSlot: this.memo.removedSlot
                              ? saveTileShapeColors(
                                    this.memo.removedSlot,
                                    shapeMap,
                                )
                              : undefined,
                          endedGame: this.memo.endedGame,
                          commands: this.memo.commands.map(
                              (c) =>
                                  c.save(shapeMap) as zod.infer<
                                      typeof RelatedCommand_S
                                  >,
                          ),
                      }
                    : undefined,
            };
        }
    };

    restorePlaceColorsCommand(
        data: zod.infer<typeof Game.PlaceColors_S>,
        shapeMap: readonly Shape[],
    ): Command {
        const command = new Game.PlaceColors(
            this,
            data.colors,
            // this creates a new tile, but we only use this for the
            // coordinates and shape
            Tile.restore(data.fixedTile, shapeMap, this.grid.sourceGrid),
            data.indexOnStack,
        );
        if (data.memo) {
            command.memo = {
                centroid: data.memo.centroid,
                removedSlot: data.memo.removedSlot
                    ? restoreTileShapeColors(data.memo.removedSlot, shapeMap)
                    : data.memo.removedSlot,
                endedGame: data.memo.endedGame,
                commands: this.restoreCommands(data.memo.commands, shapeMap),
            };
        }
        return command;
    }

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

    static UpdatePoints_S = zod.object({
        command: zod.literal("Game.UpdatePoints"),
        points: zod.int(),
    });

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

        save(): zod.infer<typeof Game.UpdatePoints_S> {
            return {
                command: "Game.UpdatePoints",
                points: this.points,
            };
        }
    };

    restoreUpdatePointsCommand(data: zod.infer<typeof Game.UpdatePoints_S>) {
        return new Game.UpdatePoints(this, data.points);
    }

    restoreCommand(
        data: unknown,
        shapeMap: readonly Shape[],
    ): Command | undefined {
        const d = RestorableCommand_S.parse(data);
        switch (d.command) {
            case "Game.Continue":
                return this.restoreContinueCommand(d, shapeMap);
            case "Game.RotateTileStack":
                return this.restoreRotateTileStackCommand(d, shapeMap);
            case "Game.PlaceColors":
                return this.restorePlaceColorsCommand(d, shapeMap);
            case "Game.UpdatePoints":
                return this.restoreUpdatePointsCommand(d);
            case "TileStackWithSlots.Restart":
                return this.tileStack.restoreRestartCommand(d, shapeMap);
            case "StatisticsMonitor.CountEvent":
                return this.stats?.restoreCountEventCommand(d);
            case "StatisticsMonitor.UpdateHighScore":
                return this.stats?.restoreUpdateHighScoreCommand(d);
        }
    }

    restoreCommands(data: unknown, shapeMap: readonly Shape[]): Command[] {
        const d = zod.array(RestorableCommand_S).safeParse(data);
        if (d.error) {
            console.log(data);
            console.log(d.error);
            return [];
        }
        const commands = [];
        for (const c of d.data) {
            const command = this.restoreCommand(c, shapeMap);
            if (command) commands.push(command);
        }
        return commands;
    }
}

const RestorableCommand_S = zod.discriminatedUnion("command", [
    Game.Continue_S,
    Game.RotateTileStack_S,
    Game.PlaceColors_S,
    Game.UpdatePoints_S,
    RelatedCommand_S,
]);

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
