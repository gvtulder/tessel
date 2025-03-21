import { ScorerOption } from "./ScorerOption";
import { SettingRow } from "./SettingRow";

export class ScorerSettingRow extends SettingRow<ScorerOption> {
    constructor() {
        super("scorer", "setup-scorer");
    }
}
