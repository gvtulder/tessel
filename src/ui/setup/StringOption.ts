/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { SettingRowOption } from "./SettingRowOption";

class StringOption extends SettingRowOption {
    constructor(key: string) {
        super(key);
        this.element.innerHTML = key;
    }
}
