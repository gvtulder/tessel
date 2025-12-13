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
            this.addOption(new StringOption(code, data.title));
        }
        this.updateColumns();
    }

    updateColumns() {
        const maxColumnLength = Math.ceil(this.options.length / 2);
        for (let i = 0; i < this.options.length; i++) {
            const el = this.options[i].element;
            el.style.gridColumn = `${i < maxColumnLength ? 1 : 2}`;
            el.style.gridRow = `${(i % maxColumnLength) + 1}`;
        }
    }
}
