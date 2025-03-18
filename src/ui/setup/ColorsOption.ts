import { BBox, TWOPI, mergeBBox } from "../../geom/math";
import { TileColors } from "../../grid/Tile";
import { SVG } from "../shared/svg";
import { NUMBER_TO_WORD, SettingRowOption } from "./SettingRowOption";

export class ColorsOption extends SettingRowOption {
    colors: TileColors;

    constructor(key: string, colors: TileColors) {
        super(key);
        this.colors = colors;
        this.element.title = `${NUMBER_TO_WORD[colors.length]} color${colors.length != 1 ? "s" : ""}`;

        const palette = SVG("svg", "palette", this.element);
        let bbox: BBox = undefined!;
        for (let i = 0; i < colors.length; i++) {
            const cx = 2 * Math.cos(TWOPI * (i / colors.length + 0.625));
            const cy = 2 * Math.sin(TWOPI * (i / colors.length + 0.625));
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
            [
                bbox.minX - 0.1,
                bbox.minY - 0.1,
                bbox.maxX - bbox.minX + 0.2,
                bbox.maxY - bbox.minY + 0.2,
            ]
                .map((c) => c.toFixed(4))
                .join(" "),
        );
    }
}
