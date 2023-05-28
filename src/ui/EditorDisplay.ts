import { Grid } from "src/grid/Grid.js";
import { PatternEditorGridDisplay } from "./PatternEditorGridDisplay.js";
import { TileEditorGridDisplay } from "./TileEditorGridDisplay.js";
import { TileEditorDisplay } from "./TileEditorDisplay.js";
import { TileStack, FixedOrderTileStack } from "src/game/TileStack.js";
import { TileStackDisplay } from "./TileStackDisplay.js";
import { Pattern } from "src/grid/Pattern.js";
import { TileEditorStackDisplay } from "./TileEditorStackDisplay.js";
import { PatternEditorDisplay } from "./PatternEditorDisplay.js";
import { EditablePattern } from "src/grid/EditablePattern.js";

export class EditorDisplay {
    tileGrid : Grid;
    patternGrid : Grid;
    pattern : EditablePattern;

    tileEditorDisplay : TileEditorDisplay;
    patternEditorDisplay : PatternEditorDisplay;
    tileStackDisplay : TileEditorStackDisplay; 
    element : HTMLDivElement;

    constructor(pattern : EditablePattern) {
        this.pattern = pattern;
        this.tileGrid = new Grid(pattern.triangleType, null);
        this.patternGrid = new Grid(pattern.triangleType, pattern);

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
        this.patternEditorDisplay = new PatternEditorDisplay(this.patternGrid);
        div.appendChild(this.patternEditorDisplay.element);

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
            this.updatePattern();
            tileStackDisplay.updateTiles(this.tileEditorDisplay.tile);
        });
    }

    rescale() {
        this.tileEditorDisplay.rescale();
        this.patternEditorDisplay.rescale();
        this.tileStackDisplay.rescale();
    }

    updatePattern() {
        const tileVariants = this.tileEditorDisplay.tile.computeRotationVariants();
        this.pattern.updatePattern([tileVariants[0].shape]);

        this.patternGrid.removeAllTiles();

        const tile = this.patternGrid.getOrAddTile(0, 0);
        tile.colors = this.tileEditorDisplay.tile.colors;

        for (const neighbor of this.patternGrid.getOrAddTileNeighbors(tile)) {
            neighbor.colors = this.tileEditorDisplay.tile.colors;
            for (const neighbor2 of this.patternGrid.getOrAddTileNeighbors(neighbor)) {
                neighbor2.colors = this.tileEditorDisplay.tile.colors;
            }
        }

        for (let x=-3; x<4; x++) {
            for (let y=-3; y<4; y++) {
                const tile = this.patternGrid.getOrAddTile(x, y);
                tile.colors = this.tileEditorDisplay.tile.colors;
            }
        }
    }
}
