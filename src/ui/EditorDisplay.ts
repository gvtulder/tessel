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
import { TileType } from "src/grid/Tile.js";
import { TileDragController } from "./TileDragController.js";
import { ColorStackDisplay } from "./ColorStackDisplay.js";

export class EditorDisplay {
    tileGrid : Grid;
    patternGrid : Grid;
    pattern : EditablePattern;

    tileEditorDisplay : TileEditorDisplay;
    patternEditorDisplay : PatternEditorDisplay;
    colorStackDisplay : ColorStackDisplay;
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

        // color stack
        this.colorStackDisplay = new ColorStackDisplay(
            (color) => this.tileEditorDisplay.updateActiveColor(color)
        );
        div.appendChild(this.colorStackDisplay.element);

        // pattern editor
        this.patternEditorDisplay = new PatternEditorDisplay(this.patternGrid, this.pattern);
        div.appendChild(this.patternEditorDisplay.element);

        // control bar
        const controlbar = document.createElement('div');
        controlbar.className = 'controlbar';
        div.appendChild(controlbar);

        // tile drag controller
        const tileDragController = new TileDragController(this.patternEditorDisplay.gridDisplay);
        // TODO destroy

        // tile stack
        const tileStackDisplay = new TileEditorStackDisplay(this.pattern, tileDragController);
        this.tileStackDisplay = tileStackDisplay;
        controlbar.appendChild(tileStackDisplay.element);

        this.rescale();

        this.tileEditorDisplay.addEventListener(TileEditorDisplay.events.EditTile, () => {
            this.updatePattern();
            tileStackDisplay.updateTiles(this.tileEditorDisplay.tile);
        });
        tileDragController.addEventListener(TileDragController.events.StartDrag, () => {
            this.element.classList.add('dragging-active');
        });
        tileDragController.addEventListener(TileDragController.events.EndDrag, () => {
            this.element.classList.remove('dragging-active');
        });
    }

    start() {
        this.updatePattern();
        this.rescale();
    }

    rescale() {
        this.tileEditorDisplay.rescale();
        this.patternEditorDisplay.rescale();
        this.tileStackDisplay.rescale();
    }

    updatePattern() {
        const tileVariants = this.tileEditorDisplay.tile.computeRotationVariants(false, false);
        if (tileVariants.length == 0) return;
        this.pattern.updatePattern([tileVariants[0].shape]);
        this.patternEditorDisplay.updateTileDisplays();
    }
}
