import { TriangleDisplay } from './TriangleDisplay.js';
import { TileDisplay } from './TileDisplay.js';
import { Grid, GridEvent } from '../grid/Grid.js';
import { Tile } from "../grid/Tile.js";
import { Triangle } from "../grid/Triangle.js";
import { ConnectorDisplay } from "./ConnectorDisplay.js";
import { DEBUG, SCALE } from 'src/settings.js';

export class GridDisplay {
    grid: Grid;
    element: HTMLDivElement;
    gridElement: HTMLDivElement;
    tileElement: HTMLDivElement;

    svg : SVGElement;
    svgTriangles : SVGElement;

    triangleDisplays: TriangleDisplay[][];
    tileDisplays: TileDisplay[][];

    left : number;
    top : number;
    width : number;
    height : number;

    scale : number;
    // margins = { top: 0, right: 0, bottom: 0, left: 0 };
    margins = { top: 30, right: 150, bottom: 30, left: 30 };
    autorescale = false;

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

        this.styleMainElement();
        this.enableAutoRescale();
    }

    build() {
        this.triangleDisplays = [];
        this.tileDisplays = [];

        const div = document.createElement('div');
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
        tileElement.className = 'tiles';
        tileElement.style.position = 'absolute';
        tileElement.style.top = '0px';
        tileElement.style.left = '0px';
        tileElement.style.zIndex = '200';
        this.tileElement = tileElement;
        this.element.appendChild(tileElement);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // TODO
        // svg.setAttribute('width', `${width}`);
        // svg.setAttribute('height', `${height}`);
        svg.setAttribute('width', '1000');
        svg.setAttribute('height', '1000');
        svg.style.position = 'absolute';
        this.gridElement.appendChild(svg);
        this.svg = svg;

        this.svgTriangles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgTriangles.setAttribute('class', 'svg-tiles');
        this.svg.appendChild(this.svgTriangles)
    }

    addTriangle(triangle: Triangle) {
        if (DEBUG.PLOT_SINGLE_TRIANGLES) {
            if (!this.triangleDisplays[triangle.x]) {
                this.triangleDisplays[triangle.x] = [];
            }
            if (!this.triangleDisplays[triangle.x][triangle.y]) {
                const triangleDisplay = new TriangleDisplay(triangle);
                this.triangleDisplays[triangle.x][triangle.y] = triangleDisplay;
                // TODO
                const group = triangleDisplay.element;
                this.svgTriangles.appendChild(group);
                const left = triangle.left * SCALE;
                const top = triangle.top * SCALE;
                group.setAttribute('transform', `translate(${left} ${top})`);
            }
        }
    }

    addTile(tile: Tile) {
        if (!this.tileDisplays[tile.x]) {
            this.tileDisplays[tile.x] = [];
        }
        if (!this.tileDisplays[tile.x][tile.y]) {
            const tileDisplay = new TileDisplay(this, tile);
            this.tileDisplays[tile.x][tile.y] = tileDisplay;
            this.tileElement.appendChild(tileDisplay.element);
            this.svgTriangles.appendChild(tileDisplay.svgTriangles);
        }

        this.left = Math.min(...this.grid.tiles.map((t) => t.left));
        this.top = Math.min(...this.grid.tiles.map((t) => t.top));
        this.width = Math.max(...this.grid.tiles.map((t) => t.left + t.width));
        this.height = Math.max(...this.grid.tiles.map((t) => t.top + t.height));

        this.update();
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
            conn.connect(triangle, this.grid.getTriangleNeighbors(triangle));
        }

        this.conn = conn;
    }

    update() {
        // TODO width is not really width?
        this.svg.setAttribute('width', `${(this.width - this.left) * SCALE}`);
        this.svg.setAttribute('height', `${(this.height - this.top) * SCALE}`);
        this.svgTriangles.setAttribute('transform', `translate(${-this.left * SCALE} ${-this.top * SCALE})`);
        this.svg.style.left = `${this.left * SCALE}px`;
        this.svg.style.top = `${this.top * SCALE}px`;

        this.rescaleGrid();
    }

    enableAutoRescale() {
        return;
    }

    styleMainElement() {
        return;
    } 

    rescaleGrid() {
        return;
    }
}


export class MainGridDisplay extends GridDisplay {
    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.zIndex = '1000';
    }

    enableAutoRescale() {
        this.autorescale = true;
        window.addEventListener('resize', () => {
            this.rescaleGrid();
        });
        this.rescaleGrid();
    }

    rescaleGrid() {
        const availWidth = document.documentElement.clientWidth - this.margins.left - this.margins.right;
        const availHeight = document.documentElement.clientHeight - this.margins.top - this.margins.bottom;
        let totalWidth = SCALE * (this.width - this.left);
        let totalHeight = SCALE * (this.height - this.top);

        /* TODO
        const skipPlaceholders = 0;
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
        this.element.style.left = `${this.margins.left + (availWidth - totalWidth) / 2 - (this.left * SCALE * scale)}px`;
        this.element.style.top = `${this.margins.top + (availHeight - totalHeight) / 2 - (this.top * SCALE * scale)}px`;

        this.scale = scale;

        this.element.classList.add('animated');
    }
}


export class TileStackGridDisplay extends GridDisplay {
    styleMainElement() {
        const div = this.element;
        div.className = 'tileStack-gridDisplay';
        div.style.position = 'absolute';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.zIndex = '1000';
    }

    enableAutoRescale() {
        return;
    }

    rescaleGrid() {
        const availWidth = 100;
        const availHeight = 100;
        let totalWidth = SCALE * (this.width - this.left);
        let totalHeight = SCALE * (this.height - this.top);

        const scale = Math.min(availWidth / totalWidth, availHeight / totalHeight);
        totalWidth *= scale;
        totalHeight *= scale;

        this.element.style.transform = `scale(${scale}`;
        this.element.style.left = `${(availWidth - totalWidth) / 2 - (this.left * SCALE * scale)}px`;
        this.element.style.top = `${(availHeight - totalHeight) / 2 - (this.top * SCALE * scale)}px`;

        this.scale = scale;
    }
}
