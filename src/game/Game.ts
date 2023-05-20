import { Grid, TileColors } from "src/grid/Grid.js";
import { FixedOrderTileStack, TileStack } from "./TileStack.js";
import { GridType } from "src/grid/GridType.js";
import { OrientedColors, Tile } from "src/grid/Tile.js";
import { Scorer, Shape } from "src/grid/Scorer.js";
import { TileGenerator } from "./TileGenerator.js";


export type GameSettings = {
    gridType : GridType,
    tilesShownOnStack : number,
    initialTile? : TileColors,
    initialTiles? : { colors: TileColors, x: number, y: number }[],
    tileGenerator : TileGenerator,
}

export class GameEvent extends Event {
    game : Game;
    scoreShapes? : Shape[];

    constructor(type : string, game : Game, scoreShapes? : Shape[]) {
        super(type);
        this.game = game;
        this.scoreShapes = scoreShapes;
    }
}

export class Game extends EventTarget {
    settings : GameSettings;
    gridType : GridType;

    grid : Grid;
    tileStack : FixedOrderTileStack;

    points : number;

    constructor(settings : GameSettings) {
        super();

        this.settings = settings;
        this.gridType = settings.gridType;

        this.setup();
    }

    setup() {
        this.points = 0;

        this.grid = new Grid(this.gridType);
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
            const tile = new this.gridType.createTile(this.grid, t.x, t.y);
            tile.colors = t.colors;
            this.grid.addTile(tile);
        }

        this.grid.updateFrontier();
    }

    placeFromStack(target : Tile, orientedColors : OrientedColors, index : number) : boolean {
        if (this.checkFit(target, orientedColors)) {
            // place tile
            target.setOrientedColors(orientedColors);
            this.tileStack.take(index);
            this.grid.updateFrontier();

            // compute scores
            this.computeScores(target);

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

    checkFit(target : Tile, orientedColors : OrientedColors) : boolean {
        return target.checkFitOrientedColors(orientedColors);
    }

    computeScores(target : Tile) {
        const shapes = Scorer.computeScores(this.grid, target);
        if (shapes.length > 0) {
            const points = shapes.map((s) => s.points).reduce((a, b) => (a + b));
            this.points += points;

            this.dispatchEvent(new GameEvent('score', this, shapes));
        }
    }
}