/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { languages } from "../..//i18n";
import { SettingRow } from "../setup/SettingRow";
import { StringOption } from "../setup/StringOption";

export class LanguagePicker extends SettingRow<StringOption> {
    constructor() {
        super("language", "language");

        for (const [code, data] of Object.entries(languages)) {
            this.addOption(
                new StringOption(code, { id: "", message: data.title }),
            );
        }
    }
}
