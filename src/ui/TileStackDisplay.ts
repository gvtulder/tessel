import { Grid } from "../grid/Grid.js";
import { TileStack } from "../game/TileStack.js";
import { Tile } from "../grid/Tile.js";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay.js";
import { TileDisplay } from "./TileDisplay.js";
import { GridType } from "src/grid/GridType.js";

export class TileStackDisplay {
    gridType : GridType;
    tileStack : TileStack;
    tileDisplays : SingleTileOnStackDisplay[];
    element : HTMLDivElement;

    numberOfTiles = 3;

    constructor(gridType : GridType, tileStack : TileStack) {
        this.gridType = gridType;
        this.tileStack = tileStack;
        this.tileDisplays = [];
        this.build();

        this.updateTiles();
    }

    updateTiles() {
        const colors = this.tileStack.peek(3);
        for (let i=0; i<this.numberOfTiles; i++) {
            this.tileDisplays[i].tile.colors = colors[i] ? colors[i] : null;
        }
    }

    build() {
        const div = document.createElement('div');
        div.className = 'tileStackDisplay';
        this.element = div;

        for (let i=0; i<this.numberOfTiles; i++) {
            const tileDisplay = new SingleTileOnStackDisplay(this.gridType);
            this.element.appendChild(tileDisplay.element);
            this.tileDisplays.push(tileDisplay);
        }
    }
}

class SingleTileOnStackDisplay {
    grid : Grid;
    gridDisplay : GridDisplay;
    tile : Tile;
    tileDisplay : TileDisplay;
    element : HTMLDivElement;

    constructor(gridType : GridType) {
        this.grid = new Grid(gridType);
        this.gridDisplay = new TileStackGridDisplay(this.grid);
        this.tile = new gridType.createTile(this.grid, 0, 0);
        this.grid.addTile(this.tile);

        this.element = document.createElement('div');
        this.element.className = 'tileOnStack';
        this.element.appendChild(this.gridDisplay.element);

        this.element.style.position = 'relative';
        this.element.style.display = 'inline-block';
        this.element.style.width = '100px';
        this.element.style.height = '100px';

        this.gridDisplay.rescaleGrid();
    }
}
