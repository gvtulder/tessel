import { Grid } from "../../grid/Grid";
import { TileColor } from "../../grid/Tile";
import icons from "../shared/icons";
import { UserEvent, UserEventType } from "../GameController";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { PaintGridDisplay } from "./PaintGridDisplay";
import { ColorStackDisplay } from "./ColorStackDisplay";
import { WONG6 } from "../../saveGames";
import { Atlas } from "../../grid/Atlas";
import { GridDisplay } from "../grid/GridDisplay";
import { AngleUse } from "../../grid/Shape";
import { SetupCatalog } from "../../saveGames";
import { TapHandler } from "../shared/TapHandler";

export class PaintMenu extends EventTarget implements ScreenDisplay {
    element: HTMLDivElement;

    options: AtlasOption[];

    backtomenubutton: Button;

    constructor() {
        super();

        // main element
        const element = (this.element = createElement(
            "div",
            "screen paint-menu-display",
        ));

        // render options
        const optionsDiv = createElement("div", "paint-options", this.element);
        this.options = [];
        for (const setting of SetupCatalog.atlas.values()) {
            const option = new AtlasOption(setting.key, setting.atlas, () => {
                this.dispatchEvent(
                    new UserEvent(UserEventType.Paint, undefined, option.key),
                );
            });
            this.options.push(option);
            optionsDiv.appendChild(option.element);
        }

        // menu button
        this.backtomenubutton = new Button(
            icons.houseIcon,
            "Back to menu",
            () => this.dispatchEvent(new Event(UserEventType.BackToMenu)),
            "backtomenu",
        );
        element.appendChild(this.backtomenubutton.element);

        // initial scaling
        this.rescale();
    }

    destroy() {
        this.element.remove();
        for (const option of this.options) {
            option.destroy();
        }
        this.backtomenubutton.destroy();
    }

    rescale() {
        for (const option of this.options) {
            option.rescale();
        }
    }
}

const PROTO_TILE_COLOR = "#6666ff";

class AtlasOption {
    element: HTMLDivElement;
    key: string;
    atlas: Atlas;
    gridDisplay: GridDisplay;
    tapHandler: TapHandler;

    constructor(key: string, atlas: Atlas, onTap: () => void) {
        this.element = createElement("div", "paint-menu-atlas-option");
        this.key = key;
        this.atlas = atlas;
        this.element.title = `${atlas.name} tiling`;

        this.tapHandler = new TapHandler(this.element);
        this.tapHandler.onTap = onTap;

        const grid = new Grid(atlas);

        const shape = grid.atlas.shapes[0];
        const poly = shape.constructPreferredPolygon(
            0,
            0,
            grid.atlas.scale,
            AngleUse.SetupAtlas,
        );
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
        const gridDisplay = new PaintOptionGridDisplay(grid, wrapper);
        wrapper.appendChild(gridDisplay.element);
        this.gridDisplay = gridDisplay;
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    destroy() {
        this.element.remove();
        this.tapHandler.destroy();
        this.gridDisplay.destroy();
    }
}

export class PaintOptionGridDisplay extends GridDisplay {
    // TODO scale based on area
    animated = false;
    margins = { top: 0, right: 0, bottom: 0, left: 0 };
}
