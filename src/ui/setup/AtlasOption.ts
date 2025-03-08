import { Atlas } from "../../grid/Atlas";
import { Grid } from "../../grid/Grid";
import { GridDisplay } from "../grid/GridDisplay";
import { OptionGridDisplay } from "./OptionGridDisplay";
import { SettingRowOption } from "./SettingRowOption";

const PROTO_TILE_COLOR = "#6666ff";

export class AtlasOption extends SettingRowOption {
    atlas: Atlas;
    gridDisplay: GridDisplay;

    constructor(key: string, atlas: Atlas) {
        super(key);
        this.atlas = atlas;

        const grid = new Grid(atlas);
        if (grid.atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        const shape = grid.atlas.shapes[0];
        const poly = shape.constructPolygonXYR(0, 0, 1);
        const tile = grid.addTile(shape, poly, poly.segment());
        tile.colors = PROTO_TILE_COLOR;
        const gridDisplay = new OptionGridDisplay(grid, this.element);
        this.element.appendChild(gridDisplay.element);
        this.gridDisplay = gridDisplay;
    }

    rescale() {
        this.gridDisplay.rescale();
    }
}
