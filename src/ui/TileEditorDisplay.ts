import { Grid, TileColors, TriangleColor } from "src/grid/Grid.js";
import { TileEditorGridDisplay, TileEditorGridEvent } from "./TileEditorGridDisplay.js";
import { TriangleOffsets, newCustomTileType } from "src/grid/CustomTile.js";
import { Tile } from "src/grid/Tile.js";
import { Edge, Triangle } from "src/grid/Triangle.js";
import { wrapModulo } from "src/utils.js";
import { DEBUG } from "src/settings.js";



const COLORS = ['red', 'blue', 'white', 'black', 'green', 'orange', 'purple'];


export class TileEditorDisplay extends EventTarget {
    grid : Grid;
    tile : EditableTile;
    gridDisplay : TileEditorGridDisplay;
    element : HTMLDivElement;

    // TODO
    copyTile : CopyTile;

    constructor(grid : Grid) {
        super();
        this.grid = grid;
        this.build();

        this.tile = new EditableTile(this.grid, 0, 0);
        this.grid.addTile(this.tile);
        this.tile.colors = [COLORS[0]];

        this.recomputeFrontier();

        if (DEBUG.TILE_EDITOR_COPY_TILE) {
            const copyTile = new CopyTile(this.grid, 0, 8);
            this.grid.addTile(copyTile);
            this.copyTile = copyTile;
        }

        this.gridDisplay.addEventListener('clicktriangle', (evt : TileEditorGridEvent) => {
            const triangle = this.grid.getOrAddTriangle(evt.x, evt.y);
            const relX = evt.x - this.tile.x;
            const relY = evt.y - this.tile.y;
            if (triangle.tile === this.tile) {
                // change color
                const newColors = [...this.tile.colors];
                for (let i=0; i<this.tile.triangles.length; i++) {
                    if (this.tile.triangles[i] === triangle) {
                        newColors[i] = COLORS[(COLORS.indexOf(newColors[i]) + 1) % COLORS.length];
                    }
                }
                this.tile.colors = newColors;
            } else {
                if (triangle.tile) {
                    this.grid.removeTile(triangle.tile);
                }
                this.tile.addTriangle(relX, relY);
                const c = this.tile.colors;
                this.tile.colors = c;
            }
            this.recomputeFrontier();
            this.dispatchEvent(new Event('edittile'));
        });

        this.gridDisplay.addEventListener('doubleclicktriangle', (evt : TileEditorGridEvent) => {
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
                const c = this.tile.colors;
                this.tile.colors = c;
            }
            this.recomputeFrontier();

            this.dispatchEvent(new Event('edittile'));

            if (DEBUG.TILE_EDITOR_COPY_TILE) {
                // copy and rotate
                const edgeFrom = this.grid.getOrAddRotationEdge(this.tile.triangles[0], 0);
                if (!window.targetTriangle) window.targetTriangle = [1, 24];
                const targetTriangle = this.grid.getOrAddTriangle(...window.targetTriangle);
                const edgeTo = this.grid.getOrAddRotationEdge(targetTriangle, 0);
                const rr = this.tile.computeRotatedOffsets(this.grid, edgeFrom, edgeTo);
                this.copyTile.replaceTriangleOffsets([...rr]);
            }
        });

        if (DEBUG.TILE_EDITOR_COPY_TILE && DEBUG.TILE_EDITOR_ROTATE_COPY) {
            let rotation = 0;
            window.setInterval(() => {
                // copy and rotate
                const edgeFrom = this.grid.getOrAddRotationEdge(this.tile.triangles[0], 0);
                if (!window.targetTriangle) window.targetTriangle = [1, 24];
                const targetTriangle = this.grid.getOrAddTriangle(...window.targetTriangle);
                const edgeTo = this.grid.getOrAddRotationEdge(targetTriangle, rotation++);
                const rr = this.tile.computeRotatedOffsets(this.grid, edgeFrom, edgeTo);
                this.copyTile.replaceTriangleOffsets([...rr]);
            }, 1000);
        }
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
            if (triangle.tile && triangle.tile !== this.tile && triangle.tile !== this.copyTile) {
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
    }

    getTileOffsets() : number[][] {
        return this.tile.triangles.map((t) => [t.x, t.y]);
    }
}

export class EditableTile extends Tile {
    triangleOffsets : number[][];
    triangles : Triangle[];

    get rotationAngles() {
        return [0];
    }

    protected mapColorsToTriangles(colors : TileColors | TriangleColor) : TileColors {
        if (!colors || typeof colors === 'string') colors = [colors as TriangleColor];
        colors = [...colors];
        while (colors.length < this.triangles.length) colors.push(colors[0]);
        for (let i=0; i<colors.length; i++) {
            if (!colors[i]) colors[i] = COLORS[0];
        }
        return colors;
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

    replaceTriangleOffsets(offsets : number[][]) {
        this.triangleOffsets = [...offsets.map((o) => [...o])];
        this.updateTriangles();
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

