import { Grid } from "src/grid/Grid.js";
import { TileEditorGridDisplay, TileEditorGridEvent } from "./TileEditorGridDisplay.js";
import { TriangleOffsets, newCustomTileType } from "src/grid/CustomTile.js";
import { Tile } from "src/grid/Tile.js";
import { Edge, Triangle } from "src/grid/Triangle.js";
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

    constructor(grid : Grid) {
        super();
        this.grid = grid;
        this.build();

        this.gridDisplay.addEventListener(TileEditorGridDisplay.events.ClickTriangle,
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

    handleTileEditorGridEvent(evt : TileEditorGridEvent) {
        if (evt.type == TileEditorGridDisplay.events.ClickTriangle) {
            const triangle = this.grid.getOrAddTriangle(...evt.triangleCoord);
            if (triangle.tile === this.tile) {
                // change color group
                const wasUnique = this.tile.rotateColorGroup(triangle);
                if (wasUnique) {
                    console.log(wasUnique);
                    this.tile.removeTriangle(triangle);
                    this.recomputeFrontier();
                }
            } else {
                if (triangle.tile) {
                    this.grid.removeTile(triangle.tile);
                }
                this.tile.addTriangle(triangle, 0);
                const c = this.tile.colors;
                this.tile.colors = c;
            }
            this.recomputeFrontier();
            this.dispatchEvent(new Event(TileEditorDisplay.events.EditTile));
        }
    }
    
    recomputeFrontier() {
        // collect the old placeholder triangles from the grid
        const oldTriangles = new Set<Triangle>();
        for (const triangle of this.grid.triangles) {
            if (triangle.tile && triangle.tile !== this.tile && triangle.tile !== this.copyTile) {
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
                const p = new Tile(this.grid, triangle.x, triangle.y, [[triangle]]);
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

export class CopyTile extends Tile {
    triangleCoordinates : number[][] = [];

    get rotationAngles() {
        return [0];
    }

    findTriangles(): Triangle[] {
        if (!this.triangleCoordinates) {
            this.triangleCoordinates = [[this.x, this.y]];
        }
        return this.triangleCoordinates.map((o) => {
            return this.grid.getOrAddTriangle(o[0], o[1]);
        });
    }

    replaceTriangleOffsets(coordinates : number[][]) {
        this.triangleCoordinates = [...coordinates.map((o) => [...o])];
        this.updateTriangles();
    }
}

