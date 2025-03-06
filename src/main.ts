import disableIosZoom from "./lib/disable-ios-zoom";
import { GameController } from "./ui/GameController";

export function startMainMenu() {
    disableIosZoom();

    if (window.location.pathname != "/") {
        window.location.href = "/";
        return;
    }

    const controller = new GameController(document.body);
    controller.run(window.location.hash.replace("#", ""));

    globalThis.gameController = controller;

    document.getElementById("version").innerHTML = `${VERSION}`;
}

const splash = document.getElementById("splash");
if (splash) {
    splash.remove();
}

startMainMenu();

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
        new URL("../service-worker.ts", import.meta.url),
        { type: "module" },
    );
}
