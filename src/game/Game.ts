/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "../grid/Grid";
import { ScoredRegion, Scorer, ScorerType } from "./scorers/Scorer";
import { ConnectedSegmentScorer } from "./scorers/ConnectedSegmentScorer";
import { Tile, TileColors } from "../grid/Tile";
import { TileGenerator, TileGenerators } from "./TileGenerator";
import { FixedOrderTileStack, TileShapeColors, TileStack } from "./TileStack";
import { Atlas } from "../grid/Atlas";
import { rotateArray } from "../geom/arrays";
import { RuleSetType } from "../grid/rules/RuleSet";
import { ColorPatternPerShape } from "../grid/Shape";
import { SetupCatalog } from "../saveGames";
import { shuffle } from "../geom/RandomSampler";
import {
    DemoGameInitializer,
    DemoGameSettings,
    GameInitializer,
} from "./GameInitializer";

export type GameSettings = {
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
};

export type GameSettingsSerialized = {
    atlas: string;
    colors: string;
    segments: number;
    uniqueTileColors: boolean;
    rules: string;
    scorer: string;
    demoGame?: DemoGameSettings;
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

export const enum GameEventType {
    EndGame = "endgame",
    Score = "score",
    UpdateSlots = "updateslots",
}

export class GameEvent extends Event {
    game?: Game;
    scoreShapes?: ScoredRegion[];

    constructor(
        type: GameEventType,
        game?: Game,
        scoreShapes?: ScoredRegion[],
    ) {
        super(type);
        this.game = game;
        this.scoreShapes = scoreShapes;
    }
}

export class Game extends EventTarget {
    settings: GameSettings;

    grid: Grid;
    scorer: Scorer;
    tileStack: FixedOrderTileStack;

    points: number;
    finished: boolean;

    constructor(settings: GameSettings) {
        super();

        this.settings = settings;
        this.finished = false;

        this.points = 0;

        this.grid = new Grid(this.settings.atlas);
        if (settings.rules) this.grid.rules = settings.rules.create();
        this.scorer = (settings.scorer || ConnectedSegmentScorer).create();

        // generate tiles
        let tiles: TileShapeColors[] = [];
        for (const tileGenerator of this.settings.tileGenerator) {
            tiles = tileGenerator(tiles, this.settings.atlas.shapes[0]);
        }
        shuffle(tiles);

        // construct the tile stack
        const tileStack = new TileStack(tiles);
        this.tileStack = new FixedOrderTileStack(
            tileStack,
            this.settings.tilesShownOnStack,
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

    finish() {
        this.finished = true;
        this.dispatchEvent(new GameEvent(GameEventType.EndGame, this));
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
        const colors = rotateArray(movingTile.colors, offset);
        const matchColors = this.grid.checkColors(fixedTile, colors);
        if (matchColors) {
            const tile = this.grid.addTile(
                fixedTile.shape,
                fixedTile.polygon,
                fixedTile.polygon.segment(),
                fixedTile.sourcePoint,
            );
            tile.colors = colors;

            this.grid.generatePlaceholders();

            if (indexOnStack !== undefined) {
                // remove from stack
                this.tileStack.take(indexOnStack);
            }

            // compute scores
            this.computeScores(tile);

            // end of game?
            if (this.tileStack.isEmpty()) {
                this.finish();
            }

            return true;
        } else {
            // does not fit
            return false;
        }
    }

    computeScores(target: Tile) {
        const shapes = this.scorer.computeScores(this.grid, target);
        if (shapes.length > 0) {
            const points = shapes.map((s) => s.points).reduce((a, b) => a + b);
            this.points += points;

            this.dispatchEvent(
                new GameEvent(GameEventType.Score, this, shapes),
            );
        }
    }
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
    };
    return settings;
}
