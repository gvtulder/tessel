/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { StatusBar } from "@capacitor/status-bar";
import { Preferences } from "@capacitor/preferences";
import { removeSplash, startMainMenu } from "./main.shared";
import { setStorageBackend, StorageI } from "./lib/storage-backend";

StatusBar.hide();

class PreferencesStorage implements StorageI {
    constructor(group: string) {
        Preferences.configure({ group: group });
    }

    async getItem(key: string): Promise<string | null> {
        return Preferences.get({ key: key }).then((result) => result.value);
    }

    setItem(key: string, value: string): void {
        Preferences.set({ key: key, value: value });
    }

    removeItem(key: string): void {
        Preferences.remove({ key: key });
    }
}

setStorageBackend(new PreferencesStorage("tessel"));

removeSplash();
startMainMenu();
