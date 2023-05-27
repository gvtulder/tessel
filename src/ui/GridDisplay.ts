import { TileDisplay, TriangleOnScreenMatch } from './TileDisplay.js';
import { Grid, GridEvent } from '../grid/Grid.js';
import { Tile, TileEvent } from "../grid/Tile.js";
import { Coord, Triangle, TriangleEvent } from "../grid/Triangle.js";
import { ConnectorDisplay } from "./ConnectorDisplay.js";
import { DEBUG, SCALE } from '../settings.js';
import { TileDragSource } from './TileDragController.js';
import { TriangleDisplay } from './TriangleDisplay.js';

export class GridDisplay extends EventTarget {
    grid: Grid;
    container : HTMLElement;
    element: HTMLDivElement;
    gridElement: HTMLDivElement;

    svg : SVGElement;
    svgGrid : SVGElement;
    svgTriangles : SVGElement;
    svgConnectors : SVGElement;

    coordinateMapper : CoordinateMapper;

    triangleDisplays: Map<Triangle, TriangleDisplay>;
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

    constructor(grid: Grid, container : HTMLElement) {
        super();
        this.grid = grid;
        this.container = container;

        this.tileDisplays = new Map<Tile, TileDisplay>();
        this.triangleDisplays = new Map<Triangle, TriangleDisplay>();

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

        this.grid.addEventListener(Triangle.events.ChangeColor, (evt: TriangleEvent) => {
            const td = this.triangleDisplays.get(evt.triangle);
            if (td) td.updateColor();
        });

        this.grid.addEventListener(Tile.events.UpdateTriangles, (evt: TileEvent) => {
            const td = this.tileDisplays.get(evt.tile);
            if (td) td.redraw();
            this.updateDimensions();
        });

        for (const tile of this.grid.tiles) {
            this.addTile(tile);
        }

        if (DEBUG.PLOT_SINGLE_TRIANGLES) {
            for (let x=-11; x<24; x++) {
                for (let y=-1; y<2; y++) {
                    const tile = new Tile(this.grid, Math.floor(x / 12), y, [[this.grid.getOrAddTriangle(x, y)]]);
                    this.grid.addTile(tile);
                    this.addTile(tile);
                }
            }
        }

        this.styleMainElement();
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

        this.coordinateMapper = new CoordinateMapper();
        this.svgGrid.appendChild(this.coordinateMapper.svgGroup);

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

        // TODO width is not really width?
        this.svg.setAttribute('width', `${(this.width - this.left) * SCALE}`);
        this.svg.setAttribute('height', `${(this.height - this.top) * SCALE}`);
        this.svgGrid.setAttribute('transform', `translate(${-this.left * SCALE} ${-this.top * SCALE})`);
        this.svg.style.left = `${this.left * SCALE}px`;
        this.svg.style.top = `${this.top * SCALE}px`;

        this.rescale();
    }

    /**
     * Returns the screen coordinates of the triangle center.
     * @param triangle the triangle
     * @returns the pixel coordinates
     */
    triangleToScreenPosition(triangle : Triangle) : Coord {
        const triangleCenter = triangle.center;
        return this.coordinateMapper.gridToScreen([
            triangle.left + triangleCenter[0],
            triangle.top + triangleCenter[1],
        ]);
    }

    /**
     * Maps the client position (from getBoundingClient rect) to the SVG grid coordinates.
     * @param clientPos the client position
     * @returns the coordinates in the SVG grid space
     */
    screenPositionToGridPosition(clientPos : Coord) : Coord {
        return this.coordinateMapper.screenToGrid(clientPos);
    }

    /**
     * Maps the client position (from getBoundingClient rect) to a triangle.
     * @param clientPos the client position
     * @returns the triangle coordinates
     */
    screenPositionToTriangleCoord(clientPos : Coord) : Coord {
        const gridCoord = this.coordinateMapper.screenToGrid(clientPos);
        return this.grid.gridPositionToTriangleCoord(gridCoord);
    }

    styleMainElement() {
        return;
    } 

    protected computeDimensionsForRescale() :
    { left : number, top : number, width : number, height : number
      availWidth : number, availHeight : number } {
        return {
            left: this.left,
            top: this.top,
            width: this.width,
            height: this.height,
            availWidth: (this.container || document.documentElement).clientWidth - this.margins.left - this.margins.right,
            availHeight: (this.container || document.documentElement).clientHeight - this.margins.top - this.margins.bottom,
        };
    }

    /**
     * Rescale the grid based on the container size.
     */
    rescale() {
        const dim = this.computeDimensionsForRescale();

        let totalWidth = SCALE * (dim.width - dim.left);
        let totalHeight = SCALE * (dim.height - dim.top);

        const scale = Math.min(dim.availWidth / totalWidth, dim.availHeight / totalHeight);
        totalWidth *= scale;
        totalHeight *= scale;

        this.element.style.transform = `scale(${scale})`;
        this.element.style.left = `${this.margins.left + (dim.availWidth - totalWidth) / 2 - (dim.left * SCALE * scale)}px`;
        this.element.style.top = `${this.margins.top + (dim.availHeight - totalHeight) / 2 - (dim.top * SCALE * scale)}px`;

        this.scale = scale;

        if (!this.element.classList.contains('animated')) {
            window.setTimeout(() => {
                this.element.classList.add('animated');
            }, 1000);
        }
    }

    dropTile(source : TileDragSource, pair : TriangleOnScreenMatch) : boolean {
        return false;
    }
}


export class TileStackGridDisplay extends GridDisplay {
    margins = { top: 0, right: 0, bottom: 0, left: 0 };

    styleMainElement() {
        const div = this.element;
        div.className = 'tileStack-gridDisplay';
        div.style.zIndex = '1000';
    }

    /*
    rescaleGrid(): void {
        const availWidth = this.container.clientWidth;
        const availHeight = this.container.clientHeight;
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
    */
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
}

class CoordinateMapper {
    svgGroup : SVGElement;
    svgUnitCircle00 : SVGElement;
    svgUnitCircle01 : SVGElement;
    svgUnitCircle10 : SVGElement;

    constructor() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('name', 'svg-CoordinateMapper');
        this.svgGroup = group;

        // measurement circles
        const unitCircle00 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        unitCircle00.setAttribute('cx', '0');
        unitCircle00.setAttribute('cy', '0');
        unitCircle00.setAttribute('r', '1');
        unitCircle00.setAttribute('fill', 'transparent');
        group.appendChild(unitCircle00);
        this.svgUnitCircle00 = unitCircle00;

        const unitCircle01 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        unitCircle01.setAttribute('cx', '0');
        unitCircle01.setAttribute('cy', '1');
        unitCircle01.setAttribute('r', '1');
        unitCircle01.setAttribute('fill', 'transparent');
        group.appendChild(unitCircle01);
        this.svgUnitCircle01 = unitCircle01;

        const unitCircle10 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        unitCircle10.setAttribute('cx', '1');
        unitCircle10.setAttribute('cy', '0');
        unitCircle10.setAttribute('r', '1');
        unitCircle10.setAttribute('fill', 'transparent');
        group.appendChild(unitCircle10);
        this.svgUnitCircle10 = unitCircle10;
    }

    private get coeff() : { x0 : number, y0 : number, scale : number, dxdx : number,
                            dydx : number, dxdy : number, dydy : number } {
        const rect00 = this.svgUnitCircle00.getBoundingClientRect();
        const rect01 = this.svgUnitCircle01.getBoundingClientRect();
        const rect10 = this.svgUnitCircle10.getBoundingClientRect();
        return {
            x0: rect00.left,
            y0: rect00.top,
            scale: rect00.width / 2,
            dxdx: rect10.left - rect00.left,
            dydx: rect10.top - rect00.top,
            dxdy: rect01.left - rect00.left,
            dydy: rect01.top - rect00.top,
        };
    }

    gridToScreen(gridPos : Coord) : Coord {
        const coeff = this.coeff;
        const x = gridPos[0] * SCALE;
        const y = gridPos[1] * SCALE;
        return [
            x * coeff.dxdx + y * coeff.dxdy + coeff.x0,
            x * coeff.dydx + y * coeff.dydy + coeff.y0,
        ];
    }

    screenToGrid(screenPos : Coord) : Coord {
        const coeff = this.coeff;
        const s = (coeff.dydx * coeff.dxdy - coeff.dxdx * coeff.dydy);
        const x = (screenPos[0] - coeff.x0) / (SCALE * s);
        const y = (screenPos[1] - coeff.y0) / (SCALE * s);
        return [
            -x * coeff.dydy + y * coeff.dxdy,
            x * coeff.dydx - y * coeff.dxdx,
        ];
    }
}
