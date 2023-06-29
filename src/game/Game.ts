import { Grid } from "src/grid/Grid.js";
import { ScoredRegion, Scorer } from "src/grid/Scorer.js";
import { Tile, TileRotation, TileShape, TileType } from "src/grid/Tile.js";
import { TileColors, Triangle, TriangleType } from "src/grid/Triangle.js";
import { TileGenerator } from "./TileGenerator.js";
import { FixedOrderTileStack, TileStack } from "./TileStack.js";
import { Pattern } from "src/grid/Pattern.js";


export type GameSettings = {
    triangleType : TriangleType,
    pattern : {
        shapes : TileShape[],
    }
    tilesShownOnStack : number,
    initialTile? : TileColors,
    initialTiles? : {
        colors: TileColors,
        x: number,
        y: number
    }[],
    tileGenerator : TileGenerator[],
}

export class GameEvent extends Event {
    game : Game;
    scoreShapes? : ScoredRegion[];

    constructor(type : string, game : Game, scoreShapes? : ScoredRegion[]) {
        super(type);
        this.game = game;
        this.scoreShapes = scoreShapes;
    }
}

export class Game extends EventTarget {
    settings : GameSettings;

    pattern : Pattern;
    grid : Grid;
    tileStack : FixedOrderTileStack;

    points : number;
    finished : boolean;

    constructor(settings : GameSettings) {
        super();

        this.settings = settings;
        this.finished = false;

        this.setup();
    }

    setup() {
        this.points = 0;

        this.pattern = new Pattern(this.settings.triangleType, this.settings.pattern.shapes);
        this.grid = new Grid(this.settings.triangleType, this.pattern);

        // generate tiles
        let tiles : TileColors[] = [];
        for (const tileGenerator of this.settings.tileGenerator) {
            tiles = tileGenerator(tiles, this.pattern);
        }

        // construct the tile stack
        const tileStack = new TileStack(tiles);
        this.tileStack = new FixedOrderTileStack(tileStack, this.settings.tilesShownOnStack);

        const initialTiles : GameSettings['initialTiles'] = [];
        if (this.settings.initialTile) {
            initialTiles.push({ x: 0, y: 0, colors: this.settings.initialTile });
        }
        if (this.settings.initialTiles) {
            initialTiles.push(...this.settings.initialTiles);
        }

        for (const t of initialTiles) {
            // TODO only works for the first initial tile
            const tile = this.pattern.constructTile(this.grid, 0, 0, 0, TileType.NormalTile);
            this.grid.addTile(tile);
            tile.colors = t.colors;
            this.tileStack.removeColors(t.colors);
        }

        this.grid.updateFrontier();
    }

    finish() {
        this.finished = true;
        this.dispatchEvent(new GameEvent('endgame', this));
    }

    placeTile(sourceTile : Tile, sourceRotation : TileRotation, sourceTriangle : Triangle, targetTriangle : Triangle, indexOnStack : number) {
        const targetTile = targetTriangle.tile;
        if (!targetTile) return false;
        const newColors = targetTile.matchShapeMapColors(
            sourceTile, sourceRotation, sourceTriangle, targetTriangle);
        if (!newColors) return false;

        if (targetTile.checkFitColors(newColors)) {
            // place tile
            targetTile.colors = newColors;
            targetTile.type = TileType.NormalTile;
            this.grid.updateFrontier();

            // remove from stack
            this.tileStack.take(indexOnStack);

            // compute scores
            this.computeScores(targetTile);

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

    computeScores(target : Tile) {
        const shapes = Scorer.computeScores(target);
        if (shapes.length > 0) {
            const points = shapes.map((s) => s.points).reduce((a, b) => (a + b));
            this.points += points;

            this.dispatchEvent(new GameEvent('score', this, shapes));
        }
    }
}