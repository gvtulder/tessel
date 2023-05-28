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

    coordinateMapper : CoordinateMapper;

    triangleDisplays: Map<Triangle, TriangleDisplay>;
    tileDisplays : Map<Tile, TileDisplay>;
    connectorDisplay : ConnectorDisplay;

    onAddTile : EventListener;
    onMoveTile : EventListener;
    onRemoveTile : EventListener;
    onChangeColor : EventListener
    onUpdateTriangles : EventListener;

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

        this.onAddTile = (evt: GridEvent) => this.addTile(evt.tile);
        // TODO @deprecated
        this.onMoveTile = () => this.updateDimensions();
        this.onRemoveTile = (evt: GridEvent) => this.removeTile(evt.tile);
        this.onChangeColor = (evt: TriangleEvent) => {
            const td = this.triangleDisplays.get(evt.triangle);
            if (td) td.updateColor();
        };
        this.onUpdateTriangles = (evt: TileEvent) => {
            const td = this.tileDisplays.get(evt.tile);
            if (td) td.redraw();
            this.updateDimensions();
        };
        
        this.grid.addEventListener(Grid.events.AddTile, this.onAddTile);
        this.grid.addEventListener('movetile', this.onMoveTile);
        this.grid.addEventListener(Grid.events.RemoveTile, this.onRemoveTile);
        this.grid.addEventListener(Triangle.events.ChangeColor, this.onChangeColor);
        this.grid.addEventListener(Tile.events.UpdateTriangles, this.onUpdateTriangles);

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

        const backgroundGrid = new BackgroundGrid(this.grid);
        this.svgGrid.appendChild(backgroundGrid.element);

        this.svgTriangles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgTriangles.setAttribute('class', 'svg-tiles');
        this.svgGrid.appendChild(this.svgTriangles)

        if (DEBUG.CONNECT_TILES) {
            this.connectorDisplay = new ConnectorDisplay(this.grid);
            this.svgGrid.appendChild(this.connectorDisplay.svgGroup);
        }
    }

    destroy() {
        for (const td of this.tileDisplays.values()) {
            td.destroy();
        }
        if (this.connectorDisplay) {
            this.connectorDisplay.destroy();
            this.connectorDisplay = null;
        }
        
        this.grid.removeEventListener(Grid.events.AddTile, this.onAddTile);
        this.grid.removeEventListener('movetile', this.onMoveTile);
        this.grid.removeEventListener(Grid.events.RemoveTile, this.onRemoveTile);
        this.grid.removeEventListener(Triangle.events.ChangeColor, this.onChangeColor);
        this.grid.removeEventListener(Tile.events.UpdateTriangles, this.onUpdateTriangles);
        this.container.remove();
        this.element.remove();
        this.gridElement.remove();
        this.svg.remove();
        this.svgGrid.remove();
        this.svgTriangles.remove();
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

    destroy() {
        this.svgGroup.remove();
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

class BackgroundGrid {
    grid : Grid;
    triangle : Triangle;

    element : SVGElement;

    constructor(grid : Grid) {
        this.grid = grid;
        this.triangle = grid.getOrAddTriangle(0, 0);

        this.build();
        this.redraw();
    }

    build() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-backgroungGrid');
        this.element = group;
    }

    redraw() {
        const pathComponents : string[] = [];
        for (let x=0; x<this.triangle.tileGridPeriodX; x++) {
            for (let y=0; y<this.triangle.tileGridPeriodY; y++) {
                const params = this.triangle.getGridParameters(x, y);
                const pointsString = params.points.map((p) => `${(p[0] + params.left) * SCALE},${(p[1] + params.top) * SCALE}`);
                pathComponents.push(`M ${pointsString[0]} L ${pointsString.slice(1).join(' ')} Z`)
            }
        }

        // draw the initial pattern
        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        outline.setAttribute('id', 'background-grid-pattern');
        outline.setAttribute('d', pathComponents.join(' '));
        outline.setAttribute('fill', 'transparent');
        outline.setAttribute('stroke', '#ccc');
        outline.setAttribute('stroke-width', '1px');
        outline.setAttribute('stroke-linejoin', 'round');
        outline.setAttribute('stroke-linecap', 'round');
        this.element.append(outline);

        // find out where to repeat it
        const params00 = this.triangle.getGridParameters(0, 0);
        const params01 = this.triangle.getGridParameters(0, this.triangle.tileGridPeriodY);
        const params10 = this.triangle.getGridParameters(this.triangle.tileGridPeriodX, 0);
        const dxdx = params10.left - params00.left;
        const dydx = params10.top - params00.top;
        const dxdy = params01.left - params00.left;
        const dydy = params01.top - params00.top;

        for (let x=-2; x<3; x++) {
            for (let y=-2; y<3; y++) {
                if (x != 0 || y != 0) {
                    const outline2 = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                    outline2.setAttribute('href', '#background-grid-pattern');
                    outline2.setAttribute('x', `${(x * dxdx - y * dxdy) * SCALE}`);
                    outline2.setAttribute('y', `${(x * dydx + y * dydy) * SCALE}`);
                    this.element.append(outline2);
                }
            }
        }
    }

    destroy() {
        this.element.remove();
    }
}

