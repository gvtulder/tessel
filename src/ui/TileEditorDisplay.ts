import { Grid, TileColors } from "src/grid/Grid.js";
import { TileEditorGridDisplay, TileEditorGridEvent } from "./TileEditorGridDisplay.js";
import { newCustomTileType } from "src/grid/CustomTile.js";
import { Tile } from "src/grid/Tile.js";
import { Triangle } from "src/grid/Triangle.js";

export class TileEditorDisplay {
    grid : Grid;
    tile : EditableTile;
    gridDisplay : TileEditorGridDisplay;
    element : HTMLDivElement;

    constructor(grid : Grid) {
        this.grid = grid;
        this.build();

        this.tile = new EditableTile(this.grid, 0, 0);
        this.grid.addTile(this.tile);

        this.recomputeFrontier();

        window.editableTile = this.tile;

        this.gridDisplay.addEventListener('clicktriangle', (evt : TileEditorGridEvent) => {
            const triangle = this.grid.getOrAddTriangle(evt.x, evt.y);
            if (triangle.tile === this.tile) {
                if (!(evt.x == 0 && evt.y == 0)) {
                    this.tile.removeTriangle(evt.x, evt.y);
                }
            } else {
                if (triangle.tile) {
                    this.grid.removeTile(triangle.tile);
                }
                this.tile.addTriangle(evt.x, evt.y);
            }
            this.recomputeFrontier();
        });
    }

    build() {
        // tile editor
        const tileGridContainer = document.createElement('div');
        tileGridContainer.className = 'tileEditorGridContainer';
        this.element = tileGridContainer;

        this.gridDisplay = new TileEditorGridDisplay(this.grid, tileGridContainer, this);
        tileGridContainer.appendChild(this.gridDisplay.element);
    }
    
    recomputeFrontier() {
        const oldTriangles = new Set<Triangle>();
        for (const triangle of this.grid.triangles) {
            if (triangle.tile && triangle.tile !== this.tile) {
                oldTriangles.add(triangle);
            }
        }
        const frontier : Triangle[] = [];
        for (const triangle of this.tile.triangles) {
            for (const n of this.grid.getOrAddTriangleNeighbors(triangle)) {
                oldTriangles.delete(n);
                if (n.tile !== this.tile) {
                    frontier.push(n);
                }
            }
        }
        for (const triangle of frontier) {
            if (!triangle.tile) {
                const p = new PlaceholderTile(this.grid, triangle.x, triangle.y);
                this.grid.addTile(p);
                p.colors = null;
            }
        }
        for (const triangle of oldTriangles.values()) {
            if (triangle.tile) {
                this.grid.removeTile(triangle.tile);
            }
        }
        this.tile.colors = ['red'];
    }
}

class EditableTile extends Tile {
    triangleOffsets : number[][];
    triangles : Triangle[];

    get rotationAngles() {
        return [0];
    }

    protected mapColorsToTriangles(colors : TileColors) : TileColors {
        return this.triangles.map(() => colors[0]);
    }
    protected mapColorsFromTriangles(colors : TileColors) : TileColors {
        return [colors[0]];
    }

    addTriangle(x : number, y : number) {
        this.triangleOffsets.push([x, y]);
        this.updateTriangles();
    }

    removeTriangle(x: number, y: number) {
        const idx = this.triangleOffsets.findIndex((v) => (v[0] == x && v[1] == y));
        if (idx > -1 && this.triangleOffsets.length > 1) {
            this.triangleOffsets.splice(idx, 1);
            this.updateTriangles();
        }
    }

    findTriangles(): Triangle[] {
        if (!this.triangleOffsets) {
            this.triangleOffsets = [[0, 0]];
        }
        return this.triangleOffsets.map((o) => {
            return this.grid.getOrAddTriangle(this.x + o[0], this.y + o[1]);
        });
    }
}

class PlaceholderTile extends Tile {
    get rotationAngles() {
        return [0];
    }

    findTriangles(): Triangle[] {
        return [this.grid.getOrAddTriangle(this.x, this.y)];
    }
}

