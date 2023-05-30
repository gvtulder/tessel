import { Grid } from "src/grid/Grid.js";
import { TileEditorGridDisplay, TileEditorGridEvent } from "./TileEditorGridDisplay.js";
import { Tile, TileType } from "src/grid/Tile.js";
import { Edge, Triangle, TriangleColor } from "src/grid/Triangle.js";
import { wrapModulo } from "src/utils.js";
import { DEBUG } from "src/settings.js";
import { EditableTile, COLORS } from "../grid/EditableTile.js";
import { GridDisplay } from "./GridDisplay.js";



export class TileEditorDisplay extends EventTarget {
    static events = {
        EditTile: 'edittile',
    };

    grid : Grid;
    tile : EditableTile;
    gridDisplay : TileEditorGridDisplay;
    element : HTMLDivElement;
    activeColor : TriangleColor;

    constructor(grid : Grid) {
        super();
        this.grid = grid;
        this.build();

        this.gridDisplay.addEventListener(TileEditorGridDisplay.events.ClickTriangle,
            (evt : TileEditorGridEvent) => this.handleTileEditorGridEvent(evt));
        this.gridDisplay.addEventListener(TileEditorGridDisplay.events.DoubleClickTriangle,
            (evt : TileEditorGridEvent) => this.handleTileEditorGridEvent(evt));

        // start with a new tile
        this.tile = new EditableTile(this.grid, 0, 0, [[this.grid.getOrAddTriangle(0, 0)]]);
        this.tile.colors = [COLORS[0]];
        this.grid.addTile(this.tile);

        this.recomputeFrontier();

        this.rescale();
    }

    build() {
        // tile editor
        const tileGridContainer = document.createElement('div');
        tileGridContainer.className = 'tileEditorGridContainer';
        this.element = tileGridContainer;

        this.gridDisplay = new TileEditorGridDisplay(this.grid, tileGridContainer);
        tileGridContainer.appendChild(this.gridDisplay.element);

        this.rescale();
    }

    rescale() {
        this.gridDisplay.rescale();
    }

    updateActiveColor(color : TriangleColor) {
        this.activeColor = color;
    }

    handleTileEditorGridEvent(evt : TileEditorGridEvent) {
        if (evt.type == TileEditorGridDisplay.events.ClickTriangle) {
            const triangle = this.grid.getOrAddTriangle(...evt.triangleCoord);
            if (triangle.tile === this.tile) {
                if (triangle.color == this.activeColor) {
                    // already the active color: remove triangle
                    this.tile.removeTriangle(triangle);
                } else {
                    // not the active color: change color
                    this.tile.setTriangleColor(triangle, this.activeColor);
                }
            } else {
                if (triangle.tile) {
                    this.grid.removeTile(triangle.tile);
                }
                this.tile.addTriangle(triangle, 0);
                this.tile.setTriangleColor(triangle, this.activeColor);
            }
            this.recomputeFrontier();
            this.dispatchEvent(new Event(TileEditorDisplay.events.EditTile));
        } else if (evt.type == TileEditorGridDisplay.events.DoubleClickTriangle) {
            this.recomputeFrontier();
            const triangle = this.grid.getOrAddTriangle(...evt.triangleCoord);
            if (triangle.tile === this.tile) {
                this.tile.removeTriangle(triangle);
                this.recomputeFrontier();
            }
            this.dispatchEvent(new Event(TileEditorDisplay.events.EditTile));
        }
    }
    
    recomputeFrontier() {
        // collect the old placeholder triangles from the grid
        const oldTriangles = new Set<Triangle>();
        for (const triangle of this.grid.triangles) {
            if (triangle.tile && triangle.tile !== this.tile) {
                oldTriangles.add(triangle);
            }
        }

        // compute the new frontier
        const frontier : Triangle[] = [];
        for (const triangle of this.tile.triangles) {
            for (const n of triangle.getOrAddNeighbors()) {
                oldTriangles.delete(n);
                if (n.tile !== this.tile) {
                    frontier.push(n);
                }
            }
        }

        // construct new tiles for the new triangles
        for (const triangle of frontier) {
            if (!triangle.tile) {
                const p = new Tile(this.grid, triangle.x, triangle.y, TileType.Placeholder, [[triangle]]);
                this.grid.addTile(p);
                p.colors = null;
            }
        }

        // remove the tiles away from the frontier
        for (const triangle of oldTriangles.values()) {
            if (triangle.tile) {
                this.grid.removeTile(triangle.tile);
            }
        }
    }

    getTileOffsets() : number[][] {
        return this.tile.triangles.map((t) => [t.x, t.y]);
    }
}

