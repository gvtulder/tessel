/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { GameSettings, GameSettingsSerialized } from "../../game/Game";

export const enum UserEventType {
    StartGame = "startgame",
    BackToMenu = "backtomenu",
    RestartGame = "restartgame",
    AllGamesMenu = "allgames",
    SetupMenu = "setupmenu",
    StartGameFromSetup = "startgamefromsetup",
    Paint = "paint",
    Settings = "settings",
    Statistics = "statistics",
    Navigate = "navigate",
}
export const enum Pages {
    MainMenu = "main",
    AllGames = "all-games",
    SetupMenu = "setup",
    PaintMenu = "paint",
    About = "about",
    Settings = "settings",
    Statistics = "statistics",
}
export class UserEvent extends Event {
    gameSettings?: GameSettings;
    gameId?: string;
    gameSettingsSerialized?: GameSettingsSerialized;

    constructor(
        type: UserEventType,
        gameSettings?: GameSettings,
        gameId?: string,
        gameSettingsSerialized?: GameSettingsSerialized,
    ) {
        super(type);
        this.gameSettings = gameSettings;
        this.gameId = gameId;
        this.gameSettingsSerialized = gameSettingsSerialized;
    }
}

export class NavigateEvent extends Event {
    page?: Pages;

    constructor(page: Pages) {
        super(UserEventType.Navigate);
        this.page = page;
    }
}
