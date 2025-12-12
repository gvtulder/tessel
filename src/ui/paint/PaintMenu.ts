/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "../../grid/Grid";
import { TileColor } from "../../grid/Tile";
import icons from "../shared/icons";
import { NavigateEvent, UserEvent } from "../shared/UserEvent";
import { UserEventType } from "../shared/UserEvent";
import { ScreenDisplay } from "../shared/ScreenDisplay";
import { createElement } from "../shared/html";
import { Button } from "../shared/Button";
import { PaintGridDisplay } from "./PaintGridDisplay";
import { ColorStackDisplay } from "./ColorStackDisplay";
import { defaultGameLists, WONG6 } from "../../saveGames";
import { Atlas } from "../../grid/Atlas";
import { GridDisplay } from "../grid/GridDisplay";
import { AngleUse } from "../../grid/Shape";
import { SetupCatalog } from "../../saveGames";
import { TapHandler } from "../shared/TapHandler";
import { msg, t } from "@lingui/core/macro";
import { MessageDescriptor } from "@lingui/core";
import { MainMenuGridDisplay } from "../menu/MainMenuGridDisplay";
import { GameListDisplay } from "../menu/GameListDisplay";
import { GameSettings } from "../../game/Game";

const PROTO_TILE_COLOR = "#6666ff";

export class PaintMenu extends GameListDisplay {
    constructor() {
        super(defaultGameLists[1], PROTO_TILE_COLOR);
        this.element.classList.add("paint-menu-display");
    }

    handleTap(gameSettings: GameSettings, saveGameId: string) {
        this.dispatchEvent(new NavigateEvent(`paint-${gameSettings.atlas.id}`));
    }

    destroy() {
        super.destroy();
    }
}
