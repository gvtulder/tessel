import disableIosZoom from "./lib/disable-ios-zoom";
import { GameController } from "./ui/GameController";

declare const VERSION: string;

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

startMainMenu();
