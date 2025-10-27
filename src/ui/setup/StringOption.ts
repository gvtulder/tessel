/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { MessageDescriptor } from "@lingui/core";
import { SettingRowOption } from "./SettingRowOption";

export class StringOption extends SettingRowOption {
    _title: MessageDescriptor;

    constructor(key: string, title: MessageDescriptor) {
        super(key);
        this._title = title;
        this.title = title;
    }

    cloneForDisplay(): ThisType<this> {
        return new StringOption(this.key, this._title);
    }
}
