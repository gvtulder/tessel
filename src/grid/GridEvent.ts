/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "./Grid";
import { Tile } from "./Tile";

export const enum GridEventType {
    AddTile = "addtile",
    RemoveTile = "removetile",
    UpdateTileColors = "updatetilecolors",
}

export class GridEvent extends Event {
    grid?: Grid;
    tile?: Tile;

    constructor(type: GridEventType, grid?: Grid, tile?: Tile) {
        super(type);
        this.grid = grid;
        this.tile = tile;
    }
}
