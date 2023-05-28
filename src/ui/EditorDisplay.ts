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
    patternEditorDisplay : PatternEditorGridDisplay
    element : HTMLDivElement;

    constructor(tileGrid : Grid, patternGrid : Grid, pattern : Pattern) {
        this.tileGrid = tileGrid;
        this.patternGrid = patternGrid;
        this.pattern = pattern;
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

        /*
        // tile stack
        const tileStackDisplay = new TileEditorStackDisplay();
        controlbar.appendChild(tileStackDisplay.element);
        tileStackDisplay.makeDraggable(null, () => { return; });

        this.tileEditorDisplay.addEventListener('edittile', () => {
            tileStackDisplay.updateTiles(this.tileEditorDisplay.tile);
        });
        */
    }

    rescale() {
        this.tileEditorDisplay.rescale();
    }

    enableAutoRescale() {
        this.tileEditorDisplay.gridDisplay.enableAutoRescale();
        this.tileEditorDisplay.gridDisplay.rescale();

        this.patternEditorDisplay.enableAutoRescale();
        this.patternEditorDisplay.rescale();
    }
}
