import { GameController } from "./ui/GameController";

// @ts-expect-error: constant set by babel transform-define plugin
export const VERSION = ENV_VERSION as string;
// @ts-expect-error: constant set by babel transform-define plugin
export const INCLUDE_SERVICE_WORKER = ENV_INCLUDE_SERVICE_WORKER as boolean;

declare global {
    // eslint-disable-next-line no-var
    var gameController: GameController;
}
