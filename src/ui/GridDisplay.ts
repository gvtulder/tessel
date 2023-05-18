import { TriangleDisplay } from './TriangleDisplay.js';
import { TileDisplay } from './TileDisplay.js';
import { NewGrid, GridEvent } from '../newgrid.js';
import { Tile } from "../grid/Tile.js";
import { Triangle } from "../grid/Triangle.js";
import { ConnectorDisplay } from "./ConnectorDisplay.js";

export class GridDisplay {
    grid: NewGrid;
    element: HTMLDivElement;
    gridElement: HTMLDivElement;
    tileElement: HTMLDivElement;

    triangleDisplays: TriangleDisplay[][];
    tileDisplays: TileDisplay[][];

    minX: number;
    minY: number;

    constructor(grid: NewGrid) {
        this.grid = grid;
        this.minX = Math.min(...grid.triangles.map((t) => t.x));
        this.minY = Math.min(...grid.triangles.map((t) => t.y));

        this.build();

        this.grid.addEventListener('addtriangle', (evt: GridEvent) => {
            this.addTriangle(evt.triangle);
        });

        this.grid.addEventListener('addtile', (evt: GridEvent) => {
            this.addTile(evt.tile);
        });
    }

    build() {
        this.triangleDisplays = [];
        this.tileDisplays = [];

        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.background = '#fff';
        div.style.zIndex = '1000';
        this.element = div;

        const gridElement = document.createElement('div');
        gridElement.style.position = 'absolute';
        gridElement.style.top = '10px';
        gridElement.style.left = '10px';
        gridElement.style.zIndex = '100';
        this.gridElement = gridElement;
        this.element.appendChild(gridElement);

        const tileElement = document.createElement('div');
        tileElement.style.position = 'absolute';
        tileElement.style.top = '10px';
        tileElement.style.left = '10px';
        tileElement.style.zIndex = '200';
        this.tileElement = tileElement;
        this.element.appendChild(tileElement);
    }

    drawTriangles() {
        for (const triangle of this.grid.triangles) {
            this.addTriangle(triangle);
        }
    }

    addTriangle(triangle: Triangle) {
        if (!this.triangleDisplays[triangle.x]) {
            this.triangleDisplays[triangle.x] = [];
        }
        if (!this.triangleDisplays[triangle.x][triangle.y]) {
            const triangleDisplay = new TriangleDisplay(this, this.grid, triangle);
            this.triangleDisplays[triangle.x][triangle.y] = triangleDisplay;
            this.gridElement.appendChild(triangleDisplay.element);
        }
    }

    addTile(tile: Tile) {
        if (!this.tileDisplays[tile.x]) {
            this.tileDisplays[tile.x] = [];
        }
        if (!this.tileDisplays[tile.x][tile.y]) {
            const tileDisplay = new TileDisplay(tile);
            this.tileDisplays[tile.x][tile.y] = tileDisplay;
            this.tileElement.appendChild(tileDisplay.element);
        }
    }

    conn: ConnectorDisplay;
    debugConnectAllTriangles() {
        const conn = new ConnectorDisplay();
        this.element.appendChild(conn.element);
        conn.element.style.position = 'absolute';
        conn.element.style.top = '10px';
        conn.element.style.left = '10px';
        conn.element.style.zIndex = '200';

        for (const triangle of this.grid.triangles) {
            conn.connect(triangle, this.grid.getNeighbors(triangle));
        }

        this.conn = conn;
    }
}
