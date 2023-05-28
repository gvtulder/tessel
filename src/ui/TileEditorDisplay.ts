import { Grid } from "src/grid/Grid.js";
import { TileEditorGridDisplay, TileEditorGridEvent } from "./TileEditorGridDisplay.js";
import { TriangleOffsets, newCustomTileType } from "src/grid/CustomTile.js";
import { Tile } from "src/grid/Tile.js";
import { Edge, Triangle } from "src/grid/Triangle.js";
import { wrapModulo } from "src/utils.js";
import { DEBUG } from "src/settings.js";
import { EditableTile, COLORS } from "../grid/EditableTile.js";



export class TileEditorDisplay extends EventTarget {
    static events = {
        EditTile: 'edittile',
    };

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

        this.gridDisplay.addEventListener('clicktriangle',
            (evt : TileEditorGridEvent) => this.handleTileEditorGridEvent(evt));

        // start with a new tile
        this.tile = new EditableTile(this.grid, 0, 0, [[this.grid.getOrAddTriangle(0, 0)]]);
        this.tile.colors = [COLORS[0]];
        this.grid.addTile(this.tile);

        this.recomputeFrontier();

        this.rescale();

        /*
        this.tile = new EditableTile(this.grid, 0, 0);
        this.grid.addTile(this.tile);
        this.tile.colors = [COLORS[0]];
        window.protoTile = this.tile;

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
                const rr = this.tile.computeRotatedTrianglePairs(this.grid, edgeFrom, edgeTo);
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
                const rr = this.tile.computeRotatedTrianglePairs(this.grid, edgeFrom, edgeTo);
                this.copyTile.replaceTriangleOffsets([...rr]);
            }, 1000);
        }
        */
    }

    build() {
        // tile editor
        const tileGridContainer = document.createElement('div');
        tileGridContainer.className = 'tileEditorGridContainer';
        this.element = tileGridContainer;

        this.gridDisplay = new TileEditorGridDisplay(this.grid, tileGridContainer);
        tileGridContainer.appendChild(this.gridDisplay.element);

        window.editorDisplay = this;
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

