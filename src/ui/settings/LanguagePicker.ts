/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { SettingRow } from "../setup/SettingRow";
import { StringOption } from "../setup/StringOption";

export class LanguagePicker extends SettingRow<StringOption> {
    constructor() {
        super("language", "language");

        this.addOption(new StringOption("en", { id: "", message: "English" }));
        this.addOption(new StringOption("nl", { id: "", message: "Dutch" }));
    }
}
