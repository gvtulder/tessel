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
        for (let i = 0; i < shape.colorPatterns.length; i++) {
            if (this.options.length <= i) {
                const option = new SegmentsOption(`${i}`);
                this.addOption(option);
            }
            this.options[i].showAtlas(atlas, colors, shape.colorPatterns[i]);
        }
        while (shape.colorPatterns.length < this.options.length) {
            this.popOption();
        }
    }
}
