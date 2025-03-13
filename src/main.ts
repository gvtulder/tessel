import { INCLUDE_SERVICE_WORKER, VERSION } from "./constants";
import disableIosZoom from "./lib/disable-ios-zoom";
import { GameController } from "./ui/GameController";

export function startMainMenu(updateServiceWorker?: () => void) {
    disableIosZoom();

    if (window.location.pathname != "/") {
        window.location.href = "/";
        return;
    }

    const controller = new GameController(document.body, VERSION);
    controller.updateServiceWorker = updateServiceWorker;
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

let updateServiceWorker;
if (INCLUDE_SERVICE_WORKER && "serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("../service-worker.js", import.meta.url),
        { type: "module" },
    );
    updateServiceWorker = () => {
        navigator.serviceWorker.ready.then((registration) => {
            registration.update();
        });
    };
}

removeSplash();
startMainMenu(updateServiceWorker);
