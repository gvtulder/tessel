import { Grid } from "src/grid/Grid.js";
import { TileEditorGridDisplay, TileEditorGridEvent } from "./TileEditorGridDisplay.js";
import { Tile, TileShape, TileType } from "src/grid/Tile.js";
import { ColorGroup, Edge, Triangle } from "src/grid/Triangle.js";
import { shiftCoordinates2, subtractCoordinates, wrapModulo } from "src/utils.js";
import { DEBUG } from "src/settings.js";
import { EditableTile, COLORS } from "../grid/EditableTile.js";
import { GridDisplay } from "./GridDisplay.js";
import { PatternEditorGridDisplay } from "./PatternEditorGridDisplay.js";
import { TileDragSource } from "./TileDragController.js";
import { TriangleOnScreenMatch } from "./TileDisplay.js";
import { EditablePattern } from "src/grid/EditablePattern.js";



export class PatternEditorDisplay extends EventTarget {
    grid : Grid;
    pattern : EditablePattern;
    gridDisplay : PatternEditorGridDisplay;
    element : HTMLDivElement;

    constructor(grid : Grid, pattern : EditablePattern) {
        super();
        this.grid = grid;
        this.pattern = pattern;
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
        console.log('dropped', pair);

        // try this shift
        const diff = subtractCoordinates(pair.fixed.coord, pair.moving.coord);
        const triangles = source.tile.triangles;
        const map = Grid.shiftToMatch(triangles, diff);

        if (map) {
            // make the shape
            const colorGroupMap = new Map<ColorGroup, number>();
            const shape : TileShape = [];
            for (const triangle of triangles) {
                if (!colorGroupMap.has(triangle.colorGroup)) {
                    colorGroupMap.set(triangle.colorGroup, colorGroupMap.size);
                    shape.push([]);
                }
                shape[colorGroupMap.get(triangle.colorGroup)].push(triangle.coord);
            }
            this.pattern.addShape(shiftCoordinates2(shape, diff));
            for (let i=0; i<this.pattern.shapes.length; i++) {
                this.grid.getOrAddTile(i, 0, TileType.PatternEditorTile);
            }
            this.gridDisplay.fillBackgroundPattern();
            return true;
        } else {
            return false;
        }
    }

}
