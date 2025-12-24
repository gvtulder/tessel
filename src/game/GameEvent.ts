/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Tile } from "../grid/Tile";
import { Game } from "./Game";
import { ScoredRegion } from "./scorers/Scorer";

export const enum GameEventType {
    EndGame = "endgame",
    ContinueGame = "continuegame",
    Score = "score",
    Points = "points",
    UpdateTileCount = "updatetilecount",
    UpdateSlots = "updateslots",
    PlaceTile = "placetile",
    UpdateCommandHistory = "updatecommandhistory",
}

export class GameEvent extends Event {
    game?: Game;
    scoreShapes?: ScoredRegion[];
    tile?: Tile;

    constructor(
        type: GameEventType,
        game?: Game | null,
        scoreShapes?: ScoredRegion[] | null,
        tile?: Tile | null,
    ) {
        super(type);
        this.game = game || undefined;
        this.scoreShapes = scoreShapes || undefined;
        this.tile = tile || undefined;
    }
}
