import { Polygon } from "src/geom/Polygon";
import {
    dist,
    distClosestPoints,
    distPolygons,
    rotatePoints,
    shiftPoints,
} from "../../geom/math";
import { Atlas } from "../../grid/Atlas";
import { Grid } from "../../grid/Grid";
import { AngleUse, ColorPattern, ColorPatternPerShape } from "../../grid/Shape";
import { TileColor, TileColors } from "../../grid/Tile";
import { GridDisplay } from "../grid/GridDisplay";
import { OptionGridDisplay } from "./OptionGridDisplay";
import { SettingRowOption } from "./SettingRowOption";
import { createElement } from "../shared/html";

export class SegmentsOption extends SettingRowOption {
    segmentsIndex: number;
    uniqueTileColors: boolean;
    colorPatternPerShape?: ColorPatternPerShape;
    gridDisplay?: GridDisplay;

    wrapper: HTMLDivElement;

    constructor(key: string, segmentsIndex: number, uniqueTileColors: boolean) {
        super(key);
        this.segmentsIndex = segmentsIndex;
        this.uniqueTileColors = uniqueTileColors;
        this.wrapper = createElement("div", "wrap-grid", this.element);
    }

    showAtlas(
        atlas: Atlas,
        colors: TileColors,
        colorPatternPerShape: ColorPatternPerShape,
    ) {
        if (this.gridDisplay) {
            this.gridDisplay.element.remove();
            this.gridDisplay.destroy();
        }
        const grid = new Grid(atlas);
        /*
        if (atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        */
        const shape = atlas.shapes[0];
        const colorPattern = colorPatternPerShape.get(shape);
        if (!colorPattern) {
            throw new Error("no color pattern found for shape");
        }

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

        const poly1 = shape.constructPreferredPolygon(
            0,
            0,
            1,
            AngleUse.SetupSegments,
        );
        const tile1 = grid.addTile(shape, poly1, poly1.segment());
        const tile1Colors = tile1.segments!.map(
            (_, i) => groupColors[colorPattern.segmentColors[0][i]],
        );
        tile1.colors = tile1Colors;

        if (this.key == "all") {
            const bbox = poly1.bbox;
            const stepX = bbox.maxX - bbox.minX;
            const stepY = bbox.maxY - bbox.minY;

            let colorVariants = [
                [0, 0, 1, 2, 3, 4, 5],
                [0, 0, 1, 1, 2, 2, 3],
                [0, 1, 0, 0, 2, 2, 0],
            ];

            let variantPolygons;

            if (shape.cornerAngles.length == 3) {
                // special case for triangles
                colorVariants = [
                    [0, 0, 1],
                    [0, 2, 2],
                    [0, 0, 0],
                ];
                const bbox = poly1.bbox;
                const bboxCenter = {
                    x: (bbox.minX + bbox.maxX) / 2,
                    y: (bbox.minY + bbox.maxY) / 2,
                };
                // 180 degree rotation
                const rotatedPoly = new Polygon(
                    shiftPoints(
                        rotatePoints(poly1.vertices, Math.PI, bboxCenter),
                        0,
                        -0.05,
                    ),
                );
                const shapeDistX = distPolygons(
                    poly1.vertices,
                    shiftPoints(rotatedPoly.vertices, 1.1 * stepX, 0),
                );
                variantPolygons = [
                    rotatedPoly.toShifted(
                        1.2 * stepX - shapeDistX,
                        0.1 * stepY,
                    ),
                    poly1.toShifted(0, 1.1 * stepY),
                    rotatedPoly.toShifted(
                        1.2 * stepX - shapeDistX,
                        1.2 * stepY,
                    ),
                ];
            } else {
                const shapeDistX = distPolygons(
                    poly1.vertices,
                    shiftPoints(poly1.vertices, 1.1 * stepX, 0),
                );
                variantPolygons = [
                    poly1.toShifted(1.2 * stepX - shapeDistX, 0),
                    poly1.toShifted(0, 1.2 * stepY),
                    poly1.toShifted(1.2 * stepX - shapeDistX, 1.2 * stepY),
                ];
            }

            for (let t = 0; t < colorVariants.length; t++) {
                const variantTile = grid.addTile(
                    shape,
                    variantPolygons[t],
                    variantPolygons[t].segment(),
                );
                variantTile.colors = colorVariants[t].map(
                    (i) => tile1Colors[i % tile1Colors.length],
                );
            }
        }

        const gridDisplay = new OptionGridDisplay(grid, this.wrapper);
        this.wrapper.appendChild(gridDisplay.element);
        this.gridDisplay = gridDisplay;
        gridDisplay.rescale();

        this.colorPatternPerShape = colorPatternPerShape;
    }

    rescale() {
        if (this.gridDisplay) {
            this.gridDisplay.rescale();
        }
    }

    destroy() {
        super.destroy();
        if (this.gridDisplay) {
            this.gridDisplay.destroy();
        }
    }
}
