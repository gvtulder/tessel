/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Workbox } from "workbox-window";
import { INCLUDE_SERVICE_WORKER } from "./constants";
import { removeSplash, startMainMenu } from "./main.shared";

let wb: Workbox | undefined = undefined;

if (INCLUDE_SERVICE_WORKER && "serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("service-worker.js", import.meta.url),
        { type: "module" },
    );
    wb = new Workbox("/service-worker.js");
    wb.register();
}

removeSplash();
startMainMenu(navigator.language, wb, "web");
