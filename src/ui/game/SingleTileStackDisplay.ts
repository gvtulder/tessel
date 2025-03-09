import type { Interactable } from "@interactjs/types";
import "@interactjs/auto-start";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";

import { Grid } from "../../grid/Grid";
import { FixedOrderTileStack, TileShapeColors } from "../../game/TileStack";
import { GameEventType } from "../../game/Game";
import { Tile, TileColors } from "../../grid/Tile";
import { Shape } from "../../grid/Shape";
import { GridDisplay } from "../grid/GridDisplay";
import { TileStackGridDisplay } from "./TileStackGridDisplay";
import { TransformComponent } from "../../geom/Transform";
import {
    TileDragController,
    TileDragSource,
    TileRotationSet,
} from "../grid/TileDragController";
import { Atlas } from "../../grid/Atlas";
import { angleDist, RAD2DEG, TWOPI } from "../../geom/math";
import { BaseTileStackDisplay, TileStackDisplay } from "./TileStackDisplay";

export class SingleTileOnStackDisplay implements TileDragSource {
    tileStackDisplay: BaseTileStackDisplay;
    indexOnStack: number;
    grid: Grid;
    gridDisplay: GridDisplay;
    tile: Tile | null;
    element: HTMLDivElement;
    rotatable: HTMLDivElement;
    draggable?: Interactable;
    rotationIdx: number;
    angle: number;
    beforeAutorotationIdx: number | null;

    baseTransform: TransformComponent;
    dragTransform: TransformComponent;
    rotateTransform: TransformComponent;

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

        this.element = document.createElement("div");
        this.element.className = "tileOnStack";

        this.rotatable = document.createElement("div");
        this.rotatable.className = "tileOnStack-rotatable";
        this.element.appendChild(this.rotatable);

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

        this.initInteractable(makeRotatable);

        this.rotatable.addEventListener("transitionend", () => {
            this.rotatable.classList.remove("animated");
            this.rotatable.classList.remove("drag-return");
            this.normalizeRotation();
        });

        this.element.addEventListener("transitionend", () => {
            this.element.classList.remove("drag-success");
            this.element.classList.remove("drag-return");
        });
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    showTile(slot: TileShapeColors | null | undefined) {
        if (this.tile) {
            this.grid.removeTile(this.tile);
            this.tile = null;
        }
        if (slot) {
            this.rotatable.classList.remove("animated");
            const poly = slot.shape.constructPolygonXYR(0, 0, 1);
            this.tile = this.grid.addTile(slot.shape, poly, poly.segment());
            this.tile.colors = slot.colors;
            this.rescale();
        }
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
            angles[this.rotationIdx],
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
        newAngle = (newAngle + TWOPI) % TWOPI;
        const oldAngle = this.angle;
        const reverseDiff = (TWOPI + oldAngle - newAngle) % TWOPI;
        const forwardDiff = (TWOPI + newAngle - oldAngle) % TWOPI;
        if (reverse || (closest && reverseDiff < forwardDiff)) {
            this.angle -= reverseDiff;
        } else {
            this.angle += forwardDiff;
        }
        this.rotatable.style.transform = `rotate(${this.angle * RAD2DEG}deg)`;
        this.rotateTransform.rotation = this.angle;
        if (animated) {
            this.rotatable.classList.add("animated");
        }
    }

    normalizeRotation() {
        if ((TWOPI + this.angle) % TWOPI != this.angle) {
            this.angle = (TWOPI + this.angle) % TWOPI;
            this.rotatable.style.transform = `rotate(${this.angle * RAD2DEG}deg)`;
        }
    }

    initInteractable(makeRotatable: boolean) {
        const draggable = this.getDraggable();
        draggable
            .on("tap", (evt: Event) => {
                if (makeRotatable) {
                    this.rotateTile();
                }
                this.tileStackDisplay.dispatchEvent(
                    new Event(TileStackDisplay.events.TapTile),
                );
                evt.preventDefault();
            })
            .on("doubletap", (evt: Event) => {
                evt.preventDefault();
            })
            .on("hold", (evt: Event) => {
                evt.preventDefault();
            });
    }

    getDraggable() {
        if (!this.draggable) {
            this.draggable = interact(this.element);
        }
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
        this.element.classList.remove("drag-return", "drag-success");
        this.element.classList.add("dragging");
    }

    endDrag(successful: boolean) {
        this.element.classList.remove("dragging");
        this.element.classList.add("drag-return");
        if (successful) {
            this.element.classList.add("drag-success");
            this.resetAutorotate(true);
        } else {
            this.resetAutorotate(false);
        }
    }

    resetDragStatus() {
        this.element.classList.remove(
            "dragging",
            "drag-return",
            "drag-success",
        );
    }

    removeDraggable() {
        if (this.draggable) {
            this.draggable.unset();
            this.draggable = undefined;
        }
    }

    /**
     * Rotates the tile to fit the target tile.
     * @param targetTile the correct rotation
     */
    startAutorotate(rotationSet: TileRotationSet) {
        if (rotationSet) {
            let newAngle = 0;
            let bestAngleDist = -1;
            for (const angle of rotationSet.relativeRotationAngles) {
                const d = angleDist(this.angle, angle);
                console.log(
                    "curAngle",
                    this.angle,
                    "newAngle",
                    angle,
                    "dist",
                    d,
                );
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
}
