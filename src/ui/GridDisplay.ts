import { TriangleDisplay } from './TriangleDisplay.js';
import { TileDisplay, TriangleOnScreenMatch, TriangleOnScreenPosition } from './TileDisplay.js';
import { Grid, GridEvent } from '../grid/Grid.js';
import { OrientedColors, Tile } from "../grid/Tile.js";
import { Triangle } from "../grid/Triangle.js";
import { ConnectorDisplay } from "./ConnectorDisplay.js";
import { DEBUG, SCALE } from '../settings.js';
import { dist } from 'src/utils.js';
import { TileDragSource } from './TileDragController.js';

export class GridDisplay extends EventTarget {
    grid: Grid;
    element: HTMLDivElement;
    gridElement: HTMLDivElement;
    tileElement: HTMLDivElement;

    svg : SVGElement;
    svgGrid : SVGElement;
    svgTriangles : SVGElement;

    triangleDisplays: TriangleDisplay[];
    tileDisplays: TileDisplay[];
    triangleDisplayGrid: TriangleDisplay[][];
    tileDisplayGrid: TileDisplay[][];

    left : number;
    top : number;
    width : number;
    height : number;
    leftNoPlaceholders : number;
    topNoPlaceholders : number;
    widthNoPlaceholders : number;
    heightNoPlaceholders : number;

    scale : number;
    // margins = { top: 0, right: 0, bottom: 0, left: 0 };
    margins = { top: 30, right: 30, bottom: 30, left: 30 };
    autorescale = false;

    constructor(grid: Grid) {
        super();
        this.grid = grid;

        this.build();

        this.grid.addEventListener('addtriangle', (evt: GridEvent) => {
            this.addTriangle(evt.triangle);
        });

        this.grid.addEventListener('addtile', (evt: GridEvent) => {
            this.addTile(evt.tile);
        });

        this.grid.addEventListener('movetile', (evt: GridEvent) => {
            this.moveTile(evt.tile, evt.oldX, evt.oldY);
        });

        this.grid.addEventListener('removetile', (evt: GridEvent) => {
            this.removeTile(evt.tile);
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
        this.triangleDisplayGrid = [];
        this.triangleDisplays = [];
        this.tileDisplayGrid = [];
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

        this.svgGrid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgGrid.setAttribute('class', 'svg-grid');
        this.svg.appendChild(this.svgGrid)

        this.svgTriangles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgTriangles.setAttribute('class', 'svg-tiles');
        this.svgGrid.appendChild(this.svgTriangles)
    }

    addTriangle(triangle: Triangle) {
        if (DEBUG.PLOT_SINGLE_TRIANGLES) {
            if (!this.triangleDisplayGrid[triangle.x]) {
                this.triangleDisplayGrid[triangle.x] = [];
            }
            if (!this.triangleDisplayGrid[triangle.x][triangle.y]) {
                const triangleDisplay = new TriangleDisplay(triangle);
                this.triangleDisplayGrid[triangle.x][triangle.y] = triangleDisplay;
                this.triangleDisplays.push(triangleDisplay);
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
        if (!this.tileDisplayGrid[tile.x]) {
            this.tileDisplayGrid[tile.x] = [];
        }
        if (!this.tileDisplayGrid[tile.x][tile.y]) {
            const tileDisplay = new TileDisplay(this, tile);
            this.tileDisplayGrid[tile.x][tile.y] = tileDisplay;
            this.tileDisplays.push(tileDisplay);
            this.tileElement.appendChild(tileDisplay.element);
            this.svgTriangles.appendChild(tileDisplay.svgTriangles);
            tileDisplay.addEventListener('updatetile', () => {
                this.updateDimensions();
            });
        }
        this.updateDimensions();
    }

    removeTile(tile : Tile) {
        const td = this.tileDisplayGrid[tile.x][tile.y];
        const idx = this.tileDisplays.indexOf(td);
        if (idx > -1) this.tileDisplays.splice(idx, 1);
        this.tileDisplayGrid[tile.x][tile.y] = null;
        this.tileElement.removeChild(td.element);
        this.svgTriangles.removeChild(td.svgTriangles);
        this.updateDimensions();
    }

    moveTile(tile : Tile, oldX : number, oldY : number) {
        this.tileDisplayGrid[tile.x][tile.y] = this.tileDisplayGrid[oldX][oldY];
        this.tileDisplayGrid[oldX][oldY] = null;
        this.updateDimensions();
    }

    updateDimensions() {
        if (this.grid.tiles.length == 0) return;

        this.left = Math.min(...this.grid.tiles.map((t) => t.left));
        this.top = Math.min(...this.grid.tiles.map((t) => t.top));
        this.width = Math.max(...this.grid.tiles.map((t) => t.left + t.width));
        this.height = Math.max(...this.grid.tiles.map((t) => t.top + t.height));

        const noPlaceholders = this.grid.tiles.filter((t) => !t.isPlaceholder());
        this.leftNoPlaceholders = Math.min(...noPlaceholders.map((t) => t.left));
        this.topNoPlaceholders = Math.min(...noPlaceholders.map((t) => t.top));
        this.widthNoPlaceholders = Math.max(...noPlaceholders.map((t) => t.left + t.width));
        this.heightNoPlaceholders = Math.max(...noPlaceholders.map((t) => t.top + t.height));

        this.update();
    }

    getTriangleOnScreenPosition() : TriangleOnScreenPosition[] {
        const t : TriangleOnScreenPosition[] = [];
        for (const td of this.tileDisplays) {
            t.push(...td.getTriangleOnScreenPosition());
        }
        return t;
    }

    findClosestTriangleFromScreenPosition(pos : TriangleOnScreenPosition[]) : TriangleOnScreenMatch {
        let closestDist = 0;
        let closest : TriangleOnScreenMatch = null;
        for (const tsd of this.tileDisplays) {
            const pair = tsd.findClosestTriangleFromScreenPosition(pos);
            if (pair && (closest === null || pair.dist < closestDist)) {
                closest = pair;
                closestDist = pair.dist;
            }
        }
        return closest;
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
        this.svgGrid.setAttribute('transform', `translate(${-this.left * SCALE} ${-this.top * SCALE})`);
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

    dropTile(source : TileDragSource, closestPair : TriangleOnScreenMatch) : boolean {
        return false;
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

        this.element.style.transform = `scale(${scale})`;
        this.element.style.left = `${(availWidth - totalWidth) / 2 - (this.left * SCALE * scale)}px`;
        this.element.style.top = `${(availHeight - totalHeight) / 2 - (this.top * SCALE * scale)}px`;

        this.scale = scale;
    }
}


export class MainMenuGridDisplay extends GridDisplay {
    styleMainElement() {
        const div = this.element;
        div.className = 'mainMenu-gridDisplay';
        div.style.position = 'absolute';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.zIndex = '1000';
    }

    enableAutoRescale() {
        return;
    }

    rescaleGrid() {
        const availWidth = 300;
        const availHeight = 300;
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
