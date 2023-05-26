import { Grid } from "src/grid/Grid.js";
import { ScoredRegion, Scorer } from "src/grid/Scorer.js";
import { Tile, TileShape } from "src/grid/Tile.js";
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
    tileGenerator : TileGenerator,
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
        const tileStack = new TileStack(this.settings.tileGenerator());
        this.tileStack = new FixedOrderTileStack(tileStack, this.settings.tilesShownOnStack);

        const initialTiles : GameSettings['initialTiles'] = [];
        if (this.settings.initialTile) {
            initialTiles.push({ x: 0, y: 0, colors: this.settings.initialTile });
        }
        if (this.settings.initialTiles) {
            initialTiles.push(...this.settings.initialTiles);
        }

        for (const t of initialTiles) {
            const tile = this.grid.getOrAddTile(t.x, t.y);
            tile.colors = t.colors;
            this.tileStack.removeColors(t.colors);
        }

        this.grid.updateFrontier();
    }

    finish() {
        this.finished = true;
        this.dispatchEvent(new GameEvent('endgame', this));
    }

    placeTile(sourceTile : Tile, sourceRotation : number, sourceTriangle : Triangle, targetTriangle : Triangle, indexOnStack : number) {
        const targetTile = targetTriangle.tile;
        if (!targetTile) return false;
        const match = targetTile.matchShape(sourceTile, sourceRotation, sourceTriangle, targetTriangle);
        if (!match) return false;

        const newColors = targetTile.colors.map(
            (c, idx) => sourceTile.colors[match.colorGroups.get(idx)]
        );

        // TODO move to tile? remove orientedColors
        if (targetTile.checkFitColors(newColors)) {
            // place tile
            // targetTile.setOrientedColors(orientedColors);
            targetTile.colors = newColors;
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

    placeFromList(tiles : []) {
        for (const tileDef of tiles) {
            const tile = new this.gridType.createTile(this.grid, tileDef[0], tileDef[1]);
            tile.colors = tileDef[2];
            this.grid.addTile(tile);
        }
        this.grid.updateFrontier();
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