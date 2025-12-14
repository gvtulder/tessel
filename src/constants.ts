/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { GameController } from "./ui/controller/GameController";

// @ts-expect-error: constant set by babel transform-define plugin
export const VERSION = ENV_VERSION as string;
// @ts-expect-error: constant set by babel transform-define plugin
export const INCLUDE_SERVICE_WORKER = ENV_INCLUDE_SERVICE_WORKER as boolean;

declare global {
    var gameController: GameController;
}
