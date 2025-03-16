import { AngleUse } from "src/grid/Shape";
import { Atlas } from "../../grid/Atlas";
import { Grid } from "../../grid/Grid";
import { GridDisplay } from "../grid/GridDisplay";
import { createElement } from "../shared/html";
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

        const shape = grid.atlas.shapes[0];
        const poly = shape.constructPreferredPolygon(0, 0, AngleUse.SetupAtlas);
        const tile = grid.addTile(shape, poly, poly.segment());
        tile.colors = PROTO_TILE_COLOR;

        for (let i = 1; i < grid.atlas.shapes.length; i++) {
            const otherShape = grid.atlas.shapes[i];
            const otherPoly = otherShape.constructPolygonEdge(
                poly.outsideEdges[i],
                0,
            );
            const otherTile = grid.addTile(
                otherShape,
                otherPoly,
                otherPoly.segment(),
            );
            otherTile.colors = PROTO_TILE_COLOR;
        }

        const wrapper = createElement("div", "wrap-grid", this.element);
        const gridDisplay = new OptionGridDisplay(grid, wrapper);
        wrapper.appendChild(gridDisplay.element);
        this.gridDisplay = gridDisplay;
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    destroy() {
        super.destroy();
        this.gridDisplay.destroy();
    }
}
