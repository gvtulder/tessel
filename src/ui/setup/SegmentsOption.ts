import { Atlas } from "../../geom/Atlas";
import { Grid } from "../../geom/Grid";
import { ColorPattern } from "../../geom/Shape";
import { TileColors } from "../../geom/Tile";
import { GridDisplay } from "../GridDisplay";
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
        tile.colors = tile.segments!.map(
            (_, i) =>
                colors[
                    colorPattern.segmentColors[0][
                        i % colorPattern.segmentColors[0].length
                    ] % colors.length
                ],
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
