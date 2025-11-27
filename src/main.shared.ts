/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { setColorScheme } from "./ui/shared/colorScheme";
import { Workbox } from "workbox-window";
import { VERSION } from "./constants";
import { GameController } from "./ui/GameController";
import { prepareI18n } from "./i18n";
import { getStorageBackend } from "./lib/storage-backend";
import { StatisticsMonitor } from "./stats/StatisticsMonitor";

export async function startMainMenu(
    language: string,
    workbox?: Workbox,
    platform?: string,
) {
    document.body.addEventListener("touchstart", preventIosZoomAndSelection, {
        passive: false,
    });

    window.addEventListener("storage", (e) => {
        if (e.key == "color-scheme") {
            setColorScheme();
        }
    });
    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", setColorScheme);
    setColorScheme();

    if (window.location.pathname != "/") {
        window.location.href = "/";
        return;
    }

    StatisticsMonitor.instance.storageBackend = getStorageBackend();
    await prepareI18n(language);

    const controller = new GameController(
        document.body,
        VERSION,
        workbox,
        platform,
    );
    controller.run(true);

    globalThis.gameController = controller;
}

export function removeSplash() {
    const splash = document.getElementById("splash");
    if (splash) {
        splash.classList.add("disappear");
        window.setTimeout(() => {
            splash.remove();
        }, 1000);
    }
}

/**
 * Prevents any default touch events, except if the target is an A element.
 */
function preventIosZoomAndSelection(e: Event) {
    const target = e.target as HTMLElement;
    if (
        (target && target.nodeName == "A") ||
        (target.closest && target.closest("a"))
    ) {
        return;
    }
    const screen = target && target.closest && target.closest(".screen");
    if (
        screen &&
        (screen.classList.contains("settings-display") ||
            screen.classList.contains("about-display") ||
            screen.classList.contains("statistics-display"))
    ) {
        return;
    }
    e.preventDefault();
}
