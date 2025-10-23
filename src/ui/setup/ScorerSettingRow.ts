/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { ScorerOption } from "./ScorerOption";
import { SettingRow } from "./SettingRow";

export class ScorerSettingRow extends SettingRow<ScorerOption> {
    constructor() {
        super("scorer", "setup-scorer", "Scoring rule");
    }
}
