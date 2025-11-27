/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import { Share, ShareOptions } from "@capacitor/share";
import { StatusBar } from "@capacitor/status-bar";
import { Preferences } from "@capacitor/preferences";
import { removeSplash, startMainMenu } from "./main.shared";
import { setStorageBackend, StorageI } from "./lib/storage-backend";
import { setShareBackend, ShareI } from "./lib/share-backend";

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

class ShareBackend implements ShareI {
    canShare() {
        return Share.canShare().then((result) => result.value);
    }

    share(options: ShareOptions) {
        Share.share(options);
    }
}

setShareBackend(new ShareBackend());

App.addListener("pause", () => {
    if (globalThis.gameController) {
        globalThis.gameController.saveControllerState();
    }
});

App.addListener("resume", () => {
    if (globalThis.gameController) {
        globalThis.gameController.clearSaveControllerState();
    }
});

Device.getLanguageCode().then((result) => {
    removeSplash();
    startMainMenu(result.value, undefined, Capacitor.getPlatform());
});
