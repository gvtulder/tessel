import type { Interactable } from "@interactjs/types";
import interact from "@interactjs/interact";

import { Grid } from "../grid/Grid.js";
import {
    TileEditorGridDisplay,
    TileEditorGridEvent,
} from "./TileEditorGridDisplay.js";
import { Tile, TileShape, TileType } from "../grid/Tile.js";
import { ColorGroup, Coord, Edge, Triangle } from "../grid/Triangle.js";
import {
    shiftCoordinates2,
    subtractCoordinates,
    wrapModulo,
} from "../utils.js";
import { DEBUG } from "../settings.js";
import { EditableTile, COLORS } from "../grid/EditableTile.js";
import { GridDisplay } from "./GridDisplay.js";
import { PatternEditorGridDisplay } from "./PatternEditorGridDisplay.js";
import { TileDragSource } from "./TileDragController.js";
import { TileOnScreenMatch } from "./TileDisplay.js";
import { EditablePattern } from "../grid/EditablePattern.js";

export class PatternEditorDisplay extends EventTarget {
    grid: Grid;
    pattern: EditablePattern;
    gridDisplay: PatternEditorGridDisplay;
    element: HTMLDivElement;

    interactable: Interactable;

    constructor(grid: Grid, pattern: EditablePattern) {
        super();
        this.grid = grid;
        this.pattern = pattern;
        this.build();

        // start with a new tile
        const tile = new Tile(this.grid, TileType.PatternEditorTile, [
            [this.grid.getOrAddTriangle(0, 0)],
        ]);
        tile.colors = ["red"];
        this.grid.addTile(tile);

        this.interactable = interact(this.gridDisplay.element);
        this.interactable.on("tap", (evt: PointerEvent) =>
            this.handleGridTap(evt),
        );

        this.rescale();
    }

    build() {
        // pattern editor
        const patternGridContainer = document.createElement("div");
        patternGridContainer.className = "patternEditorGridContainer";
        this.element = patternGridContainer;

        this.gridDisplay = new PatternEditorGridDisplay(
            this,
            this.grid,
            patternGridContainer,
        );
        patternGridContainer.appendChild(this.gridDisplay.element);

        this.rescale();
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    dropTile(source: TileDragSource, pair: TileOnScreenMatch): boolean {
        console.log("dropped", pair);

        const map = source.tile.mapShape(
            pair.fixed,
            source.rotation,
            pair.moving,
        );
        if (map) {
            // correct mapping, but does it fit?

            // look at the current pattern
            const existingTriangles = new Set<Triangle>();
            const neighborTriangles = new Set<Triangle>();
            for (const tile of this.grid.tiles) {
                for (const triangle of tile.triangles) {
                    existingTriangles.add(triangle);
                    for (const neighbor of triangle.getOrAddNeighbors()) {
                        neighborTriangles.add(neighbor);
                    }
                }
            }

            // must touch one of the existing tiles,
            // but not overlap
            let touch = false;
            let overlap = false;
            for (const triangle of map.values()) {
                if (existingTriangles.has(triangle)) {
                    overlap = true;
                    break;
                }
                if (neighborTriangles.has(triangle)) {
                    touch = true;
                }
            }

            if (overlap || !touch) {
                return false;
            }

            // everything ok
            const colorGroupMap = new Map<ColorGroup, number>();
            const shape: TileShape = [];
            for (const [from, to] of map.entries()) {
                if (!colorGroupMap.has(from.colorGroup)) {
                    colorGroupMap.set(from.colorGroup, colorGroupMap.size);
                    shape.push([]);
                }
                shape[colorGroupMap.get(from.colorGroup)].push(to.coord);
            }
            this.pattern.addShape(shape);
            this.updateTileDisplays();
            return true;
        } else {
            return false;
        }
    }

    handleGridTap(evt: PointerEvent) {
        const cursorPos: Coord = [evt.clientX, evt.clientY];
        const triangleCoord =
            this.gridDisplay.screenPositionToTriangleCoord(cursorPos);
        if (triangleCoord) {
            const triangle = this.grid.getTriangle(...triangleCoord);
            if (triangle && triangle.tile) {
                throw new Error("not implemented x!");
                /*
                this.pattern.removeShape(triangle.tile.x);
                this.grid.removeTile(triangle.tile);
                this.updateTileDisplays();
                */
            }
        }
    }

    updateTileDisplays() {
        return;
        /*
        this.grid.removeAllTiles();
        for (let i=0; i<this.pattern.shapes.length; i++) {
            const tile = this.grid.getOrAddTile(i, 0, TileType.PatternEditorTile);
        }
        this.gridDisplay.fillBackgroundPattern();
        for (const tile of this.grid.tiles) {
            for (const triangle of tile.triangles) {
                const coloredTriangle = this.gridDisplay.backgroundFillPatternGrid.getTriangle(...triangle.coord);
                triangle.color = coloredTriangle.color;
            }
        }
        */
    }
}
