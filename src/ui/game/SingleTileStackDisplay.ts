/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "../../grid/Grid";
import { TileShapeColors } from "../../game/TileStack";
import { Tile } from "../../grid/Tile";
import { AngleUse } from "../../grid/Shape";
import { GridDisplay } from "../grid/GridDisplay";
import { TileStackGridDisplay } from "./TileStackGridDisplay";
import { TransformComponent } from "../../geom/Transform";
import { TileDragSource, TileRotationSet } from "../grid/TileDragController";
import { Atlas } from "../../grid/Atlas";
import { angleDistDeg, RAD2DEG } from "../../geom/math";
import { BaseTileStackDisplay, TileStackDisplay } from "./TileStackDisplay";
import { DEG2RAD } from "../../geom/math";
import { DragHandler, DragHandlerEvent } from "../shared/DragHandler";
import { createElement } from "../shared/html";

export class SingleTileOnStackDisplay implements TileDragSource {
    tileStackDisplay: BaseTileStackDisplay;
    indexOnStack: number;
    grid: Grid;
    gridDisplay: GridDisplay;
    current: TileShapeColors | null | undefined;
    tile: Tile | null;
    element: HTMLDivElement;
    rotatable: HTMLDivElement;
    draggable: DragHandler;
    rotationIdx: number;
    // angle in degrees to prevent rounding errors
    angle: number;
    beforeAutorotationIdx: number | null;
    normalizeRotationTimeout?: number;

    baseTransform: TransformComponent;
    dragTransform: TransformComponent;
    rotateTransform: TransformComponent;

    onDragTransitionEnd: EventListener;

    constructor(
        tileStackDisplay: BaseTileStackDisplay,
        indexOnStack: number,
        atlas: Atlas,
        makeRotatable: boolean,
    ) {
        this.tile = null;
        this.rotationIdx = 0;
        this.angle = 0;
        this.beforeAutorotationIdx = null;

        this.tileStackDisplay = tileStackDisplay;
        this.indexOnStack = indexOnStack;
        this.grid = new Grid(atlas);

        this.element = createElement("div", "tile-on-stack");
        this.element.className = "tile-on-stack";

        this.rotatable = createElement("div", "rotatable", this.element);

        this.gridDisplay = new TileStackGridDisplay(this.grid, this.rotatable);

        this.baseTransform = {};
        this.dragTransform = {};
        this.rotateTransform = {};
        this.gridDisplay.parentTransforms.push(
            this.rotateTransform,
            this.dragTransform,
            this.baseTransform,
        );

        this.rotatable.appendChild(this.gridDisplay.element);

        /*
        // TODO : this doesn't work for the hexagons
        let meanX = mean(this.grid.triangles.map((t) => (t.left + t.center[0])));
        let meanY = mean(this.grid.triangles.map((t) => (t.top + t.center[1])));
        meanX = meanX * 100 + parseFloat(this.gridDisplay.element.style.left.replace('px', ''));
        meanY = meanY * 100 + parseFloat(this.gridDisplay.element.style.top.replace('px', ''));
        this.rotatable.style.transformOrigin = `${meanX}px ${meanY}px`;
        */

        // TODO disabled interact js
        this.draggable = new DragHandler(this.rotatable);
        this.initInteractable(makeRotatable);

        this.onDragTransitionEnd = () => {
            this.element.classList.remove(
                "tile-drag-success",
                "tile-drag-return",
            );
            this.rotatable.classList.remove(
                "rotatable-drag-success",
                "rotatable-drag-return",
            );
        };
        this.rotatable.addEventListener(
            "transitionend",
            this.onDragTransitionEnd,
        );
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    showTile(slot: TileShapeColors | null | undefined) {
        if (this.current === slot) return;
        if (this.tile) {
            this.grid.removeTile(this.tile);
            this.tile = null;
        }
        if (slot) {
            this.rotatable.classList.remove("animated");
            const poly = slot.shape.constructPreferredPolygon(
                0,
                0,
                this.grid.atlas.scale,
                AngleUse.StackDisplay,
            );
            this.tile = this.grid.addTile(slot.shape, poly, poly.segment());
            this.tile.colors = slot.colors;
            this.rotateTileTo(0);
            this.rescale();
        }
        this.current = slot;
    }

    disable() {
        this.element.style.display = "none";
    }

    rotateTile() {
        this.rotateTileTo(this.rotationIdx + 1, false, true, true);
    }

    rotateTileTo(
        newRotationIdx: number,
        reverse?: boolean,
        closest?: boolean,
        animated?: boolean,
    ) {
        const angles = this.grid.atlas.orientations;
        this.rotationIdx = newRotationIdx % angles.length;
        this.rotateTileToAngle(
            Math.round(angles[this.rotationIdx] * RAD2DEG),
            reverse,
            closest,
            animated,
        );
    }

    rotateTileToAngle(
        newAngle: number,
        reverse?: boolean,
        closest?: boolean,
        animated?: boolean,
    ) {
        newAngle = (newAngle + 360) % 360;
        const oldAngle = this.angle % 360;
        const reverseDiff = (360 + oldAngle - newAngle) % 360;
        const forwardDiff = (360 + newAngle - oldAngle) % 360;
        if (reverse || (closest && reverseDiff < forwardDiff)) {
            this.angle -= reverseDiff;
        } else {
            this.angle += forwardDiff;
        }
        this.rotatable.style.rotate = `${this.angle}deg`;
        this.rotateTransform.rotation = this.angle * DEG2RAD;
        if (animated) {
            this.rotatable.classList.add("animated");
            this.scheduleNormalizeRotation();
        } else {
            this.normalizeRotation();
        }
    }

    scheduleNormalizeRotation() {
        if (this.normalizeRotationTimeout) {
            window.clearTimeout(this.normalizeRotationTimeout);
        }
        this.normalizeRotationTimeout = window.setTimeout(
            () => this.normalizeRotation(),
            500,
        );
    }

    normalizeRotation() {
        if ((360 + this.angle) % 360 != this.angle) {
            this.angle = (360 + this.angle) % 360;
            this.rotateTransform.rotation = this.angle * DEG2RAD;
            this.rotatable.classList.remove("animated");
            this.rotatable.style.rotate = `${this.angle}deg`;
        }
    }

    initInteractable(makeRotatable: boolean) {
        this.draggable.onTap = (evt: DragHandlerEvent) => {
            if (makeRotatable) {
                this.element.classList.remove(
                    "tile-drag-success",
                    "tile-drag-return",
                );
                this.rotatable.classList.remove(
                    "rotatable-drag-success",
                    "rotatable-drag-return",
                );
                this.rotateTile();
            }
            this.tileStackDisplay.dispatchEvent(
                new Event(TileStackDisplay.events.TapTile),
            );
            evt.event.preventDefault();
        };
        /*
        TODO other events?
        const draggable = this.getDraggable();
        draggable
            .on("tap", (evt: Event) => {})
            .on("doubletap", (evt: Event) => {
                evt.preventDefault();
            })
            .on("hold", (evt: Event) => {
                evt.preventDefault();
            });
            */
    }

    getDraggable() {
        return this.draggable;
    }

    startDrag() {
        const rect = this.element.getBoundingClientRect();
        this.baseTransform.dx = rect.left;
        this.baseTransform.dy = rect.top;
        this.dragTransform.originX = rect.width / 2;
        this.dragTransform.originY = rect.height / 2;
        this.rotateTransform.originX = rect.width / 2;
        this.rotateTransform.originY = rect.height / 2;
        this.element.classList.remove("tile-drag-return", "tile-drag-success");
        this.rotatable.classList.remove(
            "rotatable-drag-return",
            "rotatable-drag-success",
        );
        this.element.classList.add("tile-dragging");
        this.rotatable.classList.add("rotatable-dragging");
    }

    endDrag(successful: boolean) {
        this.element.classList.remove("tile-dragging");
        this.rotatable.classList.remove("rotatable-dragging");
        this.element.classList.add("tile-drag-return");
        this.rotatable.classList.add("rotatable-drag-return");
        if (successful) {
            this.element.classList.add("tile-drag-success");
            this.rotatable.classList.add("rotatable-drag-success");
            this.resetAutorotate(true);
        } else {
            this.resetAutorotate(false);
        }
    }

    resetDragStatus() {
        this.element.classList.remove(
            "tile-dragging",
            "tile-drag-return",
            "tile-drag-success",
        );
        this.rotatable.classList.remove(
            "rotatable-dragging",
            "rotatable-drag-return",
            "rotatable-drag-success",
        );
    }

    removeDraggable() {
        // TODO remove
    }

    /**
     * Rotates the tile to fit the target tile.
     * @param targetTile the correct rotation
     */
    startAutorotate(rotationSet: TileRotationSet) {
        if (rotationSet) {
            // retrieve the user-selected angle before dragging
            const preDragAngle = Math.round(
                this.grid.atlas.orientations[this.rotationIdx] * RAD2DEG,
            );
            let newAngle = 0;
            let bestAngleDist = -1;
            for (const angleRad of rotationSet.relativeRotationAngles) {
                const angle = Math.round(angleRad * RAD2DEG);
                // prefer to return to the user-selected angle
                if (angleDistDeg(preDragAngle, angle) < 1) {
                    newAngle = angle;
                    break;
                }
                const d = angleDistDeg(this.angle, angle);
                if (bestAngleDist == -1 || d < bestAngleDist) {
                    newAngle = angle;
                    bestAngleDist = d;
                }
            }
            this.rotateTileToAngle(newAngle, false, true, true);
        } else {
            this.resetAutorotate();
        }
    }

    /**
     * Resets the rotation to the state before autorotation.
     */
    resetAutorotate(notAnimated?: boolean) {
        this.rotateTileTo(this.rotationIdx, false, true, !notAnimated);
    }

    destroy() {
        this.gridDisplay.destroy();
        this.draggable.destroy();
        this.rotatable.removeEventListener(
            "transitionend",
            this.onDragTransitionEnd,
        );
        if (this.normalizeRotationTimeout) {
            window.clearTimeout(this.normalizeRotationTimeout);
        }
        this.element.remove();
    }
}
