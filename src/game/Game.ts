import { Grid } from "../geom/Grid";
import { ScoredRegion, Scorer } from "./Scorer";
import { Tile, TileColors } from "../geom/Tile";
import { TileGenerator } from "./TileGenerator";
import { FixedOrderTileStack, TileShapeColors, TileStack } from "./TileStack";
import { Atlas } from "../geom/Atlas";
import { rotateArray } from "../geom/math";

export type GameSettings = {
    atlas: Atlas;
    tilesShownOnStack: number;
    initialTile: TileColors;
    tileGenerator: TileGenerator[];
};

export class GameEvent extends Event {
    game?: Game;
    scoreShapes?: ScoredRegion[];

    constructor(type: string, game: Game, scoreShapes?: ScoredRegion[]) {
        super(type);
        this.game = game;
        this.scoreShapes = scoreShapes;
    }
}

export class Game extends EventTarget {
    settings: GameSettings;

    grid: Grid;
    tileStack: FixedOrderTileStack;

    points: number;
    finished: boolean;

    constructor(settings: GameSettings) {
        super();

        this.settings = settings;
        this.finished = false;

        this.points = 0;

        this.grid = new Grid(this.settings.atlas);

        // generate tiles
        let tiles: TileShapeColors[] = [];
        for (const tileGenerator of this.settings.tileGenerator) {
            tiles = tileGenerator(tiles, this.settings.atlas.shapes[0]);
        }

        // construct the tile stack
        const tileStack = new TileStack(tiles);
        this.tileStack = new FixedOrderTileStack(
            tileStack,
            this.settings.tilesShownOnStack,
        );

        const initialTileColors = this.settings.initialTile;
        const shape = this.grid.atlas.shapes[0];
        const poly = shape.constructPolygonXYR(0, 0, 1);
        const tile = this.grid.addTile(shape, poly, poly.segment());
        tile.colors = initialTileColors;
        this.tileStack.removeColors({ shape: shape, colors: tile.colors });

        this.grid.generatePlaceholders();
    }

    finish() {
        this.finished = true;
        this.dispatchEvent(new GameEvent("endgame", this));
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
        const shapes = Scorer.computeScores(target);
        if (shapes.length > 0) {
            const points = shapes.map((s) => s.points).reduce((a, b) => a + b);
            this.points += points;

            this.dispatchEvent(new GameEvent("score", this, shapes));
        }
    }
}
