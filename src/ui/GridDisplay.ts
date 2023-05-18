import { TriangleDisplay } from './TriangleDisplay.js';
import { TileDisplay } from './TileDisplay.js';
import { Grid, GridEvent } from '../grid/Grid.js';
import { Tile } from "../grid/Tile.js";
import { Triangle } from "../grid/Triangle.js";
import { ConnectorDisplay } from "./ConnectorDisplay.js";
import { SCALE } from 'src/settings.js';

export class GridDisplay {
    grid: Grid;
    element: HTMLDivElement;
    gridElement: HTMLDivElement;
    tileElement: HTMLDivElement;

    triangleDisplays: TriangleDisplay[][];
    tileDisplays: TileDisplay[][];

    left : number;
    top : number;
    width : number;
    height : number;

    scale : number;
    margins = { top: 30, right: 150, bottom: 30, left: 30 };

    constructor(grid: Grid) {
        this.grid = grid;

        this.build();

        this.grid.addEventListener('addtriangle', (evt: GridEvent) => {
            this.addTriangle(evt.triangle);
        });

        this.grid.addEventListener('addtile', (evt: GridEvent) => {
            this.addTile(evt.tile);
        });

        for (const triangle of this.grid.triangles) {
            this.addTriangle(triangle);
        }

        for (const tile of this.grid.tiles) {
            this.addTile(tile);
        }

        window.addEventListener('resize', () => {
            this.rescaleGrid();
        });
        this.rescaleGrid();
    }

    build() {
        this.triangleDisplays = [];
        this.tileDisplays = [];

        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.background = '#fff';
        div.style.zIndex = '1000';
        this.element = div;

        const gridElement = document.createElement('div');
        gridElement.className = 'grid';
        gridElement.style.position = 'absolute';
        gridElement.style.top = '0px';
        gridElement.style.left = '0px';
        gridElement.style.zIndex = '100';
        this.gridElement = gridElement;
        this.element.appendChild(gridElement);

        const tileElement = document.createElement('div');
        gridElement.className = 'tiles';
        tileElement.style.position = 'absolute';
        tileElement.style.top = '0px';
        tileElement.style.left = '0px';
        tileElement.style.zIndex = '200';
        this.tileElement = tileElement;
        this.element.appendChild(tileElement);
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

        this.left = Math.min(...this.grid.tiles.map((t) => t.left));
        this.top = Math.min(...this.grid.tiles.map((t) => t.top));
        this.width = Math.max(...this.grid.tiles.map((t) => t.left + t.width));
        this.height = Math.max(...this.grid.tiles.map((t) => t.top + t.height));
    }

    conn: ConnectorDisplay;
    debugConnectAllTriangles() {
        const conn = new ConnectorDisplay();
        this.element.appendChild(conn.element);
        conn.element.style.position = 'absolute';
        conn.element.style.top = '0px';
        conn.element.style.left = '0px';
        conn.element.style.zIndex = '200';

        for (const triangle of this.grid.triangles) {
            conn.connect(triangle, this.grid.getNeighbors(triangle));
        }

        this.conn = conn;
    }

    update() {
        this.rescaleGrid();
    }

    rescaleGrid() {
        const availWidth = document.documentElement.clientWidth - this.margins.left - this.margins.right;
        const availHeight = document.documentElement.clientHeight - this.margins.top - this.margins.bottom;
        let totalWidth = SCALE * (this.width - this.left);
        let totalHeight = SCALE * (this.height - this.top);

        const skipPlaceholders = 0;
        /* TODO
        if (this.isGameFinished()) {
            totalWidth -= 200;
            totalHeight -= 200;
            skipPlaceholders = 1;
        }
        */

        const scale = Math.min(availWidth / totalWidth, availHeight / totalHeight);
        totalWidth *= scale;
        totalHeight *= scale;

        this.element.style.transform = `scale(${scale}`;
        this.element.style.left = `${this.margins.left + (availWidth - totalWidth) / 2}px`;
        this.element.style.top = `${this.margins.top + (availHeight - totalHeight) / 2}px`;

        this.scale = scale;

        this.element.classList.add('animated');
    }
}
