import { TileColors } from "../../geom/Tile";
import { RulesOption } from "./RulesOption";
import { SettingRow } from "./SettingRow";

export class RulesSettingRow extends SettingRow<RulesOption> {
    constructor() {
        super();
    }

    updateColors(colors: TileColors) {
        for (const option of this.options) {
            option.updateColors(colors);
        }
    }
}
