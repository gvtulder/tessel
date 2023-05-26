import { TriangleDisplay } from './TriangleDisplay.js';
import { TileDisplay, TriangleOnScreenMatch, TriangleOnScreenPosition } from './TileDisplay.js';
import { Grid, GridEvent } from '../grid/Grid.js';
import { Tile } from "../grid/Tile.js";
import { Coord, Triangle } from "../grid/Triangle.js";
import { ConnectorDisplay } from "./ConnectorDisplay.js";
import { DEBUG, SCALE } from '../settings.js';
import { TileDragSource } from './TileDragController.js';

export class GridDisplay extends EventTarget {
    grid: Grid;
    element: HTMLDivElement;
    gridElement: HTMLDivElement;

    svg : SVGElement;
    svgGrid : SVGElement;
    svgUnitCircle : SVGElement;
    svgTriangles : SVGElement;
    svgConnectors : SVGElement;

    tileDisplays : Map<Tile, TileDisplay>;
    connectorDisplay : ConnectorDisplay;

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

        this.tileDisplays = new Map<Tile, TileDisplay>();

        this.build();

        this.grid.addEventListener(Grid.events.AddTile, (evt: GridEvent) => {
            this.addTile(evt.tile);
        });

        // TODO @deprecated
        this.grid.addEventListener('movetile', () => {
            this.updateDimensions();
        });

        this.grid.addEventListener(Grid.events.RemoveTile, (evt: GridEvent) => {
            this.removeTile(evt.tile);
        });

        for (const tile of this.grid.tiles) {
            this.addTile(tile);
        }

        this.styleMainElement();
        this.enableAutoRescale();
    }

    build() {
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

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        this.gridElement.appendChild(svg);
        this.svg = svg;

        this.svgGrid = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgGrid.setAttribute('class', 'svg-grid');
        this.svg.appendChild(this.svgGrid)

        const unitCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        unitCircle.setAttribute('cx', '0');
        unitCircle.setAttribute('cy', '0');
        unitCircle.setAttribute('r', '1');
        unitCircle.setAttribute('fill', 'transparent');
        this.svgGrid.appendChild(unitCircle);
        this.svgUnitCircle = unitCircle;

        this.svgTriangles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgTriangles.setAttribute('class', 'svg-tiles');
        this.svgGrid.appendChild(this.svgTriangles)

        if (DEBUG.CONNECT_TILES) {
            this.connectorDisplay = new ConnectorDisplay(this.grid);
            this.svgGrid.appendChild(this.connectorDisplay.svgGroup);
        }
    }

    addTile(tile: Tile) {
        if (!this.tileDisplays.has(tile)) {
            const tileDisplay = new TileDisplay(this, tile);
            this.tileDisplays.set(tile, tileDisplay);
            this.svgTriangles.appendChild(tileDisplay.svgTriangles);
            tileDisplay.addEventListener(TileDisplay.events.UpdateTile, () => {
                this.updateDimensions();
            });
        }
        this.updateDimensions();
    }

    removeTile(tile : Tile) {
        const td = this.tileDisplays.get(tile);
        if (!td) return;
        this.tileDisplays.delete(tile);
        this.svgTriangles.removeChild(td.svgTriangles);
        this.updateDimensions();
    }

    updateDimensions() {
        if (this.grid.tiles.length == 0) return;

        const tiles = [...this.grid.tiles.values()];
        this.left = Math.min(...tiles.map((t) => t.left));
        this.top = Math.min(...tiles.map((t) => t.top));
        this.width = Math.max(...tiles.map((t) => t.left + t.width));
        this.height = Math.max(...tiles.map((t) => t.top + t.height));

        const noPlaceholders = tiles.filter((t) => !t.isPlaceholder());
        this.leftNoPlaceholders = Math.min(...noPlaceholders.map((t) => t.left));
        this.topNoPlaceholders = Math.min(...noPlaceholders.map((t) => t.top));
        this.widthNoPlaceholders = Math.max(...noPlaceholders.map((t) => t.left + t.width));
        this.heightNoPlaceholders = Math.max(...noPlaceholders.map((t) => t.top + t.height));

        this.update();
    }

    getTriangleOnScreenPosition() : TriangleOnScreenPosition[] {
        const t : TriangleOnScreenPosition[] = [];
        for (const td of this.tileDisplays.values()) {
            t.push(...td.getTriangleOnScreenPosition());
        }
        return t;
    }

    findClosestTriangleFromScreenPosition(pos : TriangleOnScreenPosition[]) : TriangleOnScreenMatch {
        let closestDist = 0;
        let closest : TriangleOnScreenMatch = null;
        for (const tsd of this.tileDisplays.values()) {
            const pair = tsd.findClosestTriangleFromScreenPosition(pos);
            if (pair && (closest === null || pair.dist < closestDist)) {
                closest = pair;
                closestDist = pair.dist;
            }
        }
        return closest;
    }

    getOriginScreenPosition() : Coord {
        const rect = this.svgUnitCircle.getBoundingClientRect();
        return [rect.left + rect.width / 2, rect.top + rect.height / 2];
    }

    /**
     * Maps the client position (from getBoundingClient rect) to the SVG grid coordinates.
     * @param clientPos the client position
     * @returns the coordinates in the SVG grid space
     */
    screenPositionToGridPosition(clientPos : Coord) : Coord {
        const rect = this.svgUnitCircle.getBoundingClientRect();
        const scale = rect.width;
        const gridPos = [
            (clientPos[0] - (rect.left + rect.width / 2) / scale),
            (clientPos[1] - (rect.top + rect.height / 2) / scale),
        ] as Coord;
        return gridPos;
    }

    /**
     * Maps the client position (from getBoundingClient rect) to a triangle.
     * @param clientPos the client position
     * @returns the triangle coordinates
     */
    screenPositionToTriangleCoord(clientPos : Coord) : Coord {
        const rect = this.svgUnitCircle.getBoundingClientRect();
        // radius of 1
        const scale = rect.width / 2;

        // position in grid space w.r.t. origin
        const gridPos = [
            ((clientPos[0] - (rect.left + rect.width / 2)) / scale) / SCALE,
            ((clientPos[1] - (rect.top + rect.height / 2)) / scale) / SCALE,
        ] as Coord;

        const triangleCoord = this.grid.gridPositionToTriangleCoord(gridPos);
        return triangleCoord;
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
