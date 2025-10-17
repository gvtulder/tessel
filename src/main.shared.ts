/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { VERSION } from "./constants";
import { GameController } from "./ui/GameController";

export function startMainMenu(workbox?: Workbox) {
    document.body.addEventListener("touchstart", preventIosZoomAndSelection, {
        passive: false,
    });

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
    if (e.target && (e.target as any).nodeName == "A") {
        return;
    }
    e.preventDefault();
}
