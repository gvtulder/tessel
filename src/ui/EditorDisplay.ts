import { Grid } from "src/grid/Grid.js";
import { PatternEditorGridDisplay } from "./PatternEditorGridDisplay.js";
import { TileEditorGridDisplay } from "./TileEditorGridDisplay.js";
import { TileEditorDisplay } from "./TileEditorDisplay.js";
import { TileStack, FixedOrderTileStack } from "src/game/TileStack.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { Pattern } from "src/grid/Pattern.js";
import { TileEditorStackDisplay } from "./TileEditorStackDisplay.js";

export class EditorDisplay {
    tileGrid : Grid;
    patternGrid : Grid;
    pattern : Pattern;

    tileEditorDisplay : TileEditorDisplay;
    patternEditorDisplay : PatternEditorGridDisplay;
    tileStackDisplay : TileEditorStackDisplay; 
    element : HTMLDivElement;

    constructor(pattern : Pattern) {
        this.pattern = pattern;
        this.tileGrid = new Grid(pattern.triangleType, null);
        this.patternGrid = new Grid(pattern.triangleType, null);

        this.build();
    }

    build() {
        const div = document.createElement('div');
        div.className = 'editorDisplay';
        this.element = div;

        // tile editor
        this.tileEditorDisplay = new TileEditorDisplay(this.tileGrid);
        div.appendChild(this.tileEditorDisplay.element);

        // pattern editor
        const patternGridContainer = document.createElement('div');
        patternGridContainer.className = 'patternEditorGridContainer';
        div.appendChild(patternGridContainer);

        this.patternEditorDisplay = new PatternEditorGridDisplay(this.patternGrid, patternGridContainer, this);
        patternGridContainer.appendChild(this.patternEditorDisplay.element);

        // control bar
        const controlbar = document.createElement('div');
        controlbar.className = 'controlbar';
        div.appendChild(controlbar);

        // tile stack
        const tileStackDisplay = new TileEditorStackDisplay(this.pattern);
        this.tileStackDisplay = tileStackDisplay;
        controlbar.appendChild(tileStackDisplay.element);

        this.rescale();
        /*
        tileStackDisplay.makeDraggable(null, () => { return; });
        */

        this.tileEditorDisplay.addEventListener(TileEditorDisplay.events.EditTile, () => {
            tileStackDisplay.updateTiles(this.tileEditorDisplay.tile);
        });
    }

    rescale() {
        this.tileEditorDisplay.rescale();
        this.tileStackDisplay.rescale();
    }
}
