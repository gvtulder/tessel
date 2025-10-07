// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { Workbox } from "workbox-window";
import { INCLUDE_SERVICE_WORKER, VERSION } from "./constants";
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

function removeSplash() {
    const splash = document.getElementById("splash");
    if (splash) {
        splash.classList.add("disappear");
        window.setTimeout(() => {
            splash.remove();
        }, 1000);
    }
}

let wb: Workbox | undefined = undefined;

if (INCLUDE_SERVICE_WORKER && "serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("../service-worker.js", import.meta.url),
        { type: "module" },
    );
    wb = new Workbox("/service-worker.js");
    wb.register();
}

removeSplash();
startMainMenu(wb);
