import { Grid, TileColors } from "src/grid/Grid.js";
import { FixedOrderTileStack, TileStack } from "./TileStack.js";
import { GridType } from "src/grid/GridType.js";
import { Tile } from "src/grid/Tile.js";


export type GameSettings = {
    gridType : GridType,
    tilesShownOnStack : number,
    initialTile : TileColors;
}

export class Game {
    settings : GameSettings;
    gridType : GridType;

    grid : Grid;
    tileStack : FixedOrderTileStack;

    constructor(settings : GameSettings) {
        this.settings = settings;
        this.gridType = settings.gridType;

        this.setup();
    }

    setup() {
        this.grid = new Grid(this.gridType);
        const tileStack = new TileStack();
        this.tileStack = new FixedOrderTileStack(tileStack, this.settings.tilesShownOnStack);

        const tile = new this.gridType.createTile(this.grid, 0, 0);
        tile.colors = this.settings.initialTile;
        this.grid.addTile(tile);

        this.grid.updateFrontier();
    }

    placeFromStack(target : Tile, index : number) {
        const colors = this.tileStack.slots[index];
        target.colors = colors;
        this.tileStack.take(index);
        this.grid.updateFrontier();
        return true;
    }
}