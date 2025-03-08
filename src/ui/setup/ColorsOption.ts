import { BBox, TWOPI, mergeBBox } from "../../geom/math";
import { TileColors } from "../../grid/Tile";
import { SVG } from "../svg";
import { SettingRowOption } from "./SettingRowOption";

export class ColorsOption extends SettingRowOption {
    colors: TileColors;

    constructor(key: string, colors: TileColors) {
        super(key);
        this.colors = colors;

        const palette = SVG("svg", "palette", this.element);
        let bbox: BBox = undefined!;
        for (let i = 0; i < colors.length; i++) {
            const cx = 2 * Math.cos(TWOPI * (i / colors.length + 0.125));
            const cy = 2 * Math.sin(TWOPI * (i / colors.length + 0.125));
            const r = 1.6 - 0.15 * colors.length;
            const circle = SVG("circle", null, palette, {
                fill: colors[i],
                cx: `${cx.toFixed(4)}`,
                cy: `${cy.toFixed(4)}`,
                r: `${r.toFixed(4)}`,
            });
            bbox = mergeBBox(bbox, {
                minX: cx - r,
                minY: cy - r,
                maxX: cx + r,
                maxY: cy + r,
            });
        }
        // palette.setAttribute("viewBox", "-3.5 -3.5 7 7");
        palette.setAttribute(
            "viewBox",
            [bbox.minX, bbox.minY, bbox.maxX - bbox.minX, bbox.maxY - bbox.minY]
                .map((c) => c.toFixed(4))
                .join(" "),
        );
    }
}
