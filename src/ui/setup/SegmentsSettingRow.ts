import { Atlas } from "../../grid/Atlas";
import { TileColors } from "../../grid/Tile";
import { SegmentsOption } from "./SegmentsOption";
import { SettingRow } from "./SettingRow";

export class SegmentsSettingRow extends SettingRow<SegmentsOption> {
    constructor() {
        super();
    }

    showAtlas(atlas: Atlas, colors: TileColors) {
        if (atlas.shapes.length != 1)
            throw new Error("atlas with multiple shapes not yet supported");
        const shape = atlas.shapes[0];
        if (this.options.length == 0) {
            const option = new SegmentsOption(`all`);
            this.addOption(option);
        }
        this.options[0].showAtlas(atlas, colors, shape.colorPatterns[0], false);
        for (let i = 0; i < shape.colorPatterns.length; i++) {
            if (this.options.length <= i + 1) {
                const option = new SegmentsOption(`${i}`);
                this.addOption(option);
            }
            this.options[i + 1].showAtlas(
                atlas,
                colors,
                shape.colorPatterns[i],
                true,
            );
        }
        while (shape.colorPatterns.length + 1 < this.options.length) {
            this.popOption();
        }
    }
}
