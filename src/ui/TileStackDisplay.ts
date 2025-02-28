import type { Interactable, DragEvent } from "@interactjs/types";
import "@interactjs/auto-start";
import "@interactjs/pointer-events";
import interact from "@interactjs/interact";

import { Grid } from "../geom/Grid";
import { FixedOrderTileStack } from "../game/TileStack";
import { Tile, TileType } from "../geom/Tile";
import { GridDisplay, TileStackGridDisplay } from "./GridDisplay";
import { TileDragController, TileDragSource } from "./TileDragController";
import { MainGridTileDragController } from "./MainGridTileDragController";
import { Atlas } from "../geom/Atlas";
import { RAD2DEG, TWOPI } from "../geom/math";

export abstract class BaseTileStackDisplay extends EventTarget {
    static events = {
        TapTile: "taptile",
    };

    atlas: Atlas;
    tileDragController: TileDragController;

    tileDisplays: SingleTileOnStackDisplay[];
    element: HTMLDivElement;

    constructor(atlas: Atlas, tileDragController: TileDragController) {
        super();
        this.atlas = atlas;
        this.tileDragController = tileDragController;
        this.tileDisplays = [];
        this.build();
    }

    /** @deprecated */
    destroy() {
        return;
    }

    build() {
        const div = document.createElement("div");
        div.className = "tileStackDisplay";
        this.element = div;
    }

    resetDragStatus() {
        for (const t of this.tileDisplays) {
            t.element.classList.remove("drag-success");
            t.element.classList.remove("drag-return");
        }
    }

    rescale() {
        for (const t of this.tileDisplays) {
            t.rescale();
        }
    }
}

export class TileStackDisplay extends BaseTileStackDisplay {
    tileStack: FixedOrderTileStack;
    element: HTMLDivElement;
    counterDiv: HTMLElement;
    counter: HTMLElement;

    constructor(
        atlas: Atlas,
        tileStack: FixedOrderTileStack,
        tileDragController: TileDragController,
    ) {
        super(atlas, tileDragController);

        this.tileStack = tileStack;

        this.updateTiles();
        this.tileStack.addEventListener("updateSlots", () => {
            this.updateTiles();
        });
    }

    /** @deprecated */
    destroy() {
        return;
    }

    updateTiles() {
        for (let i = 0; i < this.tileStack.numberShown; i++) {
            if (this.tileDisplays.length <= i) {
                const tileDisplay = new SingleTileOnStackDisplay(
                    this,
                    i,
                    this.atlas,
                    true,
                );
                this.element.insertBefore(tileDisplay.element, this.counterDiv);
                this.tileDisplays.push(tileDisplay);
                this.tileDragController.addSource(tileDisplay);
            }

            const color = this.tileStack.slots[i];
            this.tileDisplays[i].tile.colors = color ? color : null;
            if (!color) this.tileDisplays[i].removeDraggable();
        }
        const n = this.tileStack.tilesLeft - this.tileStack.numberShown;
        if (n > 0) {
            this.counter.innerHTML = `+ ${n} tile${n == 1 ? "" : "s"}`;
        } else {
            this.counter.innerHTML = "";
        }
    }

    take(tile: Tile) {
        let index = 0;
        while (
            index < this.tileStack.numberShown &&
            !(this.tileDisplays[index].tile === tile)
        ) {
            index++;
        }
        if (index < this.tileStack.numberShown) {
            this.tileStack.take(index);
            this.updateTiles();
        }
    }

    build() {
        super.build();

        const counterDiv = document.createElement("div");
        this.element.appendChild(counterDiv);
        counterDiv.className = "tileStackDisplay-counter";
        this.counterDiv = counterDiv;

        const counter = document.createElement("span");
        counterDiv.appendChild(counter);
        this.counter = counterDiv;
    }
}

export interface DraggableTileHTMLDivElement extends HTMLDivElement {
    tileDisplay?: SingleTileOnStackDisplay;
    indexOnStack?: number;
}

export class SingleTileOnStackDisplay implements TileDragSource {
    tileStackDisplay: BaseTileStackDisplay;
    indexOnStack: number;
    grid: Grid;
    gridDisplay: GridDisplay;
    tile: Tile;
    element: HTMLDivElement;
    rotatable: HTMLDivElement;
    draggable: Interactable;
    rotationIdx: number;
    angle: number;
    beforeAutorotationIdx: number;

    constructor(
        tileStackDisplay: BaseTileStackDisplay,
        indexOnStack: number,
        atlas: Atlas,
        makeRotatable: boolean,
    ) {
        this.rotationIdx = 0;
        this.angle = 0;
        this.beforeAutorotationIdx = null;

        this.tileStackDisplay = tileStackDisplay;
        this.indexOnStack = indexOnStack;
        this.grid = new Grid(atlas);
        if (atlas.shapes.length > 1)
            throw new Error("atlas with more than one shape not implemented");
        const shape = atlas.shapes[0];
        const poly = shape.constructPolygonXYR(0, 0, 1);
        this.tile = this.grid.addTile(shape, poly, poly.segment());

        this.element = document.createElement("div");
        this.element.className = "tileOnStack";

        this.rotatable = document.createElement("div");
        this.rotatable.className = "tileOnStack-rotatable";
        this.element.appendChild(this.rotatable);

        this.gridDisplay = new TileStackGridDisplay(this.grid, this.rotatable);

        this.rotatable.appendChild(this.gridDisplay.element);

        this.rescale();

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

    /**
     * Updates the tile shape and rotates to the given rotation.
     * @param shape the new tile shape
     * @param rotationIdx the required rotation
     */
    updateTileFromShape(shape: TileShape, rotationIdx: number) {
        this.tile.updateTrianglesFromShape(shape);
        this.rotateTileTo(rotationIdx);
        this.element.style.display = "";
    }

    disable() {
        this.element.style.display = "none";
    }

    get rotation(): TileRotation {
        return this.grid.atlas.orientations[this.rotationIdx];
    }

    rotateTile() {
        this.rotateTileTo(this.rotationIdx + 1, false, true);
    }

    rotateTileTo(newRotation: number, reverse?: boolean, closest?: boolean) {
        const angles = this.grid.atlas.orientations;
        const oldAngle = angles[this.rotationIdx];
        this.rotationIdx = newRotation % angles.length;
        const reverseDiff =
            (TWOPI + oldAngle - angles[this.rotationIdx]) % TWOPI;
        const forwardDiff =
            (TWOPI + angles[this.rotationIdx] - oldAngle) % TWOPI;
        if (reverse || (closest && reverseDiff < forwardDiff)) {
            this.angle -= reverseDiff;
        } else {
            this.angle += forwardDiff;
        }
        this.rotatable.style.transform = `rotate(${this.angle * RAD2DEG}deg)`;
        this.rotatable.classList.add("animated");
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

    resetCoordinateMapperCache() {
        this.gridDisplay.coordinateMapper.resetCoeffCache();
    }

    removeDraggable() {
        if (this.draggable) {
            this.draggable.unset();
            this.draggable = null;
        }
    }

    /**
     * Rotates the tile to fit the target tile.
     * @param targetTile the correct rotation
     */
    startAutorotate(rotation: TileRotation) {
        if (rotation) {
            if (this.beforeAutorotationIdx === null) {
                this.beforeAutorotationIdx = this.rotationIdx;
            }
            const rotationIdx = this.tile.rotations.findIndex(
                (r) => r.steps == rotation.steps,
            );
            this.rotateTileTo(rotationIdx, false, true);
        } else {
            this.resetAutorotate();
        }
    }

    /**
     * Resets the rotation to the state before autorotation.
     * @param keepRotation if true, does not rotate back
     */
    resetAutorotate(keepRotation?: boolean) {
        if (this.beforeAutorotationIdx !== null) {
            const oldRotationIdx = this.beforeAutorotationIdx;
            this.beforeAutorotationIdx = null;
            if (!keepRotation) {
                this.rotateTileTo(oldRotationIdx, false, true);
            }
        }
    }
}
