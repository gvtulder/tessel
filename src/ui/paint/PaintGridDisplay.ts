// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { PlaceholderTile } from "../../grid/Tile";
import { Grid } from "../../grid/Grid";
import { GridDisplay } from "../grid/GridDisplay";
import { PaintDisplay } from "./PaintDisplay";
import { DragHandler, DragHandlerEvent } from "../shared/DragHandler";

export class PaintGridDisplay extends GridDisplay {
    paintDisplay: PaintDisplay;
    dragHandler: DragHandler;

    constructor(
        grid: Grid,
        container: HTMLElement,
        paintDisplay: PaintDisplay,
    ) {
        super(grid, container);
        this.paintDisplay = paintDisplay;

        this.dragHandler = new DragHandler(this.element);
        const paintTile = (evt: DragHandlerEvent) => {
            const clientPos = { x: evt.event.clientX, y: evt.event.clientY };
            const gridPos = this.screenToGridPosition(clientPos);
            let tile = this.grid.findTileAtPoint(gridPos);

            if (tile) {
                const color = paintDisplay.currentColor;
                if (!color) {
                    if (
                        this.grid.tiles.size > 1 &&
                        !(tile instanceof PlaceholderTile)
                    ) {
                        this.grid.removeTile(tile);
                        this.grid.generatePlaceholders();
                    }
                    return;
                }
                if (tile instanceof PlaceholderTile) {
                    tile = this.grid.addTile(
                        tile.shape,
                        tile.polygon,
                        tile.polygon.segment(),
                        tile.sourcePoint,
                    );
                    this.grid.generatePlaceholders();
                }
                tile.colors = color;
            }
        };
        this.dragHandler.onTap = paintTile;
        this.dragHandler.onDragMove = paintTile;
        this.dragHandler.onDragEnd = (evt: DragHandlerEvent) => {
            this.rescale();
        };
    }

    rescale() {
        if (!this.dragHandler.dragging) {
            super.rescale();
        }
    }

    destroy() {
        super.destroy();
        this.dragHandler.destroy();
    }
}
