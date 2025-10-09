/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { VERSION } from "./constants";
import disableIosZoom from "./lib/disable-ios-zoom";
import { GameController } from "./ui/GameController";

export function startMainMenu(workbox?: Workbox) {
    disableIosZoom();

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
