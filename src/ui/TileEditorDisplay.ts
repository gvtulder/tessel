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
            const relX = evt.x - this.tile.x;
            const relY = evt.y - this.tile.y;
            if (triangle.tile === this.tile) {
                this.tile.removeTriangle(relX, relY);
            } else {
                if (triangle.tile) {
                    this.grid.removeTile(triangle.tile);
                }
                this.tile.addTriangle(relX, relY);
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

export class EditableTile extends Tile {
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

    removeTriangle(x: number, y: number) : boolean {
        const idx = this.triangleOffsets.findIndex((v) => (v[0] == x && v[1] == y));
        if (idx > -1 && this.triangleOffsets.length > 1) {
            const triangle = this.triangles[idx];
            const offsets = this.triangleOffsets[idx];

            // is this a center triangle?
            const nb = this.grid.getTriangleNeighbors(triangle).filter(
                (n) => n.tile === this);
            if (nb.length == 3) return false;

            // is this an important connection to other triangles?
            const marked = new Set<Triangle>;
            const start = this.triangles[idx > 0 ? 0 : 1];
            const queue : Triangle[] = [start];
            marked.add(start);
            while (queue.length > 0) {
                const t = queue.pop();
                // follow connections
                for (const n of this.grid.getTriangleNeighbors(t)) {
                    if (n !== triangle
                        && n.tile === this
                        && !marked.has(n)) {
                        queue.push(n);
                        marked.add(n);
                    }
                }
            }
            // unreachable triangles if we remove this?
            if (marked.size != this.triangles.length - 1) return false;

            // remove triangle offset
            this.triangleOffsets.splice(idx, 1);

            if (offsets[0] == 0 && offsets[1] == 0) {
                // this was the current anchor of the tile
                // recompute the offsets for the new anchor
                const newAnchor = [...this.triangleOffsets[0]];
                this.triangleOffsets = this.triangleOffsets.map(
                    (o) => {
                        return [o[0] - newAnchor[0], o[1] - newAnchor[1]];
                    }
                );
                this.grid.moveTile(this, newAnchor[0] + this.x, newAnchor[1] + this.y);
            }

            this.updateTriangles();
            return true;
        }
        return false;
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

