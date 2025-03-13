import { INCLUDE_SERVICE_WORKER, VERSION } from "./constants";
import disableIosZoom from "./lib/disable-ios-zoom";
import { GameController } from "./ui/GameController";

export function startMainMenu() {
    disableIosZoom();

    if (window.location.pathname != "/") {
        window.location.href = "/";
        return;
    }

    const controller = new GameController(document.body, VERSION);
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

removeSplash();
startMainMenu();

if (INCLUDE_SERVICE_WORKER && "serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("../service-worker.ts", import.meta.url),
        { type: "module" },
    );
}
