import { Atlas } from "../../grid/Atlas";
import { Grid } from "../../grid/Grid";
import { ColorPattern } from "../../grid/Shape";
import { TileColor, TileColors } from "../../grid/Tile";
import { GridDisplay } from "../grid/GridDisplay";
import { OptionGridDisplay } from "./OptionGridDisplay";
import { SettingRowOption } from "./SettingRowOption";

export class SegmentsOption extends SettingRowOption {
    colorPattern?: ColorPattern;
    gridDisplay?: GridDisplay;

    constructor(key: string) {
        super(key);
    }

    showAtlas(atlas: Atlas, colors: TileColors, colorPattern: ColorPattern) {
        if (this.gridDisplay) {
            this.gridDisplay.element.remove();
            this.gridDisplay.destroy();
        }
        const grid = new Grid(atlas);
        if (atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        const shape = atlas.shapes[0];
        const poly = shape.constructPolygonXYR(0, 0, 1);
        const tile = grid.addTile(shape, poly, poly.segment());
        const groupColors: TileColor[] = [];
        for (let i = 0; i < colorPattern.numColors; i++) {
            groupColors.push(colors[i % colors.length]);
        }
        // if groupColors.length == colors.length + 1,
        // the first and last group will get the same color.
        // in that case, swap the color of the two last groups
        // to make the segments recognizable
        if (groupColors.length > 2 && groupColors.length % colors.length == 1) {
            groupColors[groupColors.length - 2] = colors[0];
            groupColors[groupColors.length - 1] = colors[colors.length - 1];
        }
        tile.colors = tile.segments!.map(
            (_, i) => groupColors[colorPattern.segmentColors[0][i]],
        );
        const gridDisplay = new OptionGridDisplay(grid, this.element);
        this.element.appendChild(gridDisplay.element);
        this.gridDisplay = gridDisplay;
        gridDisplay.rescale();
        this.colorPattern = colorPattern;
    }

    rescale() {
        if (this.gridDisplay) {
            this.gridDisplay.rescale();
        }
    }
}
