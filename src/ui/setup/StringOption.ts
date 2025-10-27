/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { SettingRowOption } from "./SettingRowOption";

class StringOption extends SettingRowOption {
    constructor(key: string, title: MessageDescriptor) {
        super(key);
        this.title = title;
    }

    cloneForDisplay(): ThisType<this> {
        return new StringOption(this.key, this.title);
    }
}
