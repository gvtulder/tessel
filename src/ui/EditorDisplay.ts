import { Grid } from "src/grid/Grid.js";
import { PatternEditorGridDisplay } from "./PatternEditorGridDisplay.js";
import { TileEditorGridDisplay } from "./TileEditorGridDisplay.js";
import { TileEditorDisplay } from "./TileEditorDisplay.js";

export class EditorDisplay {
    tileGrid : Grid;
    patternGrid : Grid;
    tileEditorDisplay : TileEditorDisplay;
    patternEditorDisplay : PatternEditorGridDisplay
    element : HTMLDivElement;

    constructor(tileGrid : Grid, patternGrid : Grid) {
        this.tileGrid = tileGrid;
        this.patternGrid = patternGrid;
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
    }

    enableAutoRescale() {
        this.tileEditorDisplay.gridDisplay.enableAutoRescale();
        this.tileEditorDisplay.gridDisplay.rescaleGrid();

        this.patternEditorDisplay.enableAutoRescale();
        this.patternEditorDisplay.rescaleGrid();
    }
}
