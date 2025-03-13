import { Atlas } from "../../grid/Atlas";
import { TileColors } from "../../grid/Tile";
import { SegmentsOption } from "./SegmentsOption";
import { SettingRow } from "./SettingRow";

export class SegmentsSettingRow extends SettingRow<SegmentsOption> {
    constructor() {
        super("setup-segments");
    }

    showAtlas(atlas: Atlas, colors: TileColors) {
        if (atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        const shape = atlas.shapes[0];

        // default option: all segments, non-unique colors
        if (this.options.length == 0) {
            const option = new SegmentsOption(`all`, 0, false);
            this.addOption(option);
        }
        this.options[0].showAtlas(atlas, colors, shape.colorPatterns[0]);

        // special options: specific segments, unique colors
        for (let i = 0; i < shape.colorPatterns.length; i++) {
            if (this.options.length <= i + 1) {
                const option = new SegmentsOption(`${i}`, i, i == 0);
                this.addOption(option);
            }
            this.options[i + 1].showAtlas(
                atlas,
                colors,
                shape.colorPatterns[i],
            );
        }

        while (shape.colorPatterns.length + 1 < this.options.length) {
            this.popOption();
        }
    }
}
