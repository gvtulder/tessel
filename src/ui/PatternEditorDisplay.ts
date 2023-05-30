import { Grid } from "src/grid/Grid.js";
import { TileEditorGridDisplay, TileEditorGridEvent } from "./TileEditorGridDisplay.js";
import { Tile, TileType } from "src/grid/Tile.js";
import { Edge, Triangle } from "src/grid/Triangle.js";
import { wrapModulo } from "src/utils.js";
import { DEBUG } from "src/settings.js";
import { EditableTile, COLORS } from "../grid/EditableTile.js";
import { GridDisplay } from "./GridDisplay.js";
import { PatternEditorGridDisplay } from "./PatternEditorGridDisplay.js";
import { TileDragSource } from "./TileDragController.js";
import { TriangleOnScreenMatch } from "./TileDisplay.js";



export class PatternEditorDisplay extends EventTarget {
    grid : Grid;
    gridDisplay : PatternEditorGridDisplay;
    element : HTMLDivElement;

    constructor(grid : Grid) {
        super();
        this.grid = grid;
        this.build();

        // start with a new tile
        const tile = new Tile(this.grid, 0, 0, TileType.PatternEditorTile, [[this.grid.getOrAddTriangle(0, 0)]]);
        tile.colors = ['red'];
        this.grid.addTile(tile);

        this.rescale();
    }

    build() {
        // pattern editor
        const patternGridContainer = document.createElement('div');
        patternGridContainer.className = 'patternEditorGridContainer';
        this.element = patternGridContainer;

        this.gridDisplay = new PatternEditorGridDisplay(this, this.grid, patternGridContainer);
        patternGridContainer.appendChild(this.gridDisplay.element);

        this.rescale();
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    dropTile(source : TileDragSource, pair : TriangleOnScreenMatch) : boolean {
        // source.tile.shiftToMatch(source.tile.triangles)

        console.log('dropped', pair);
        return false;
    }

}
