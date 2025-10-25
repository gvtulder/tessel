/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { setColorScheme } from "./ui/shared/colorScheme";
import { Workbox } from "workbox-window";
import { VERSION } from "./constants";
import { GameController } from "./ui/GameController";

export function startMainMenu(workbox?: Workbox) {
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

    const controller = new GameController(document.body, VERSION, workbox);
    controller.run();

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = e.target as HTMLElement;
    if (target && target.nodeName == "A") {
        return;
    }
    if (
        target &&
        target.closest &&
        target.closest(".screen.settings-display")
    ) {
        return;
    }
    console.log("Prevent default.");
    e.preventDefault();
}
