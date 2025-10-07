/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { TileColors } from "../../grid/Tile";
import { RulesOption } from "./RulesOption";
import { SettingRow } from "./SettingRow";

export class RulesSettingRow extends SettingRow<RulesOption> {
    constructor() {
        super("rules", "setup-rules");
    }

    updateColors(colors: TileColors) {
        for (const option of this.options) {
            option.updateColors(colors);
        }
    }
}
