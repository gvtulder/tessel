/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { msg } from "@lingui/core/macro";
import { ScorerOption } from "./ScorerOption";
import { SettingRow } from "./SettingRow";

export class ScorerSettingRow extends SettingRow<ScorerOption> {
    constructor() {
        super(
            "scorer",
            "setup-scorer",
            msg({ id: "ui.setup.optionTitle.scorer", message: "Scoring rule" }),
        );
    }
}
