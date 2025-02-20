import { TileDisplay } from "./TileDisplay";
import { Grid } from "../geom/Grid";
import { GridEvent, GridEventType } from "../geom/GridEvent";
import { Tile } from "../geom/Tile";
import { ConnectorDisplay } from "./ConnectorDisplay";
import { DEBUG } from "../settings";
import { BBox, Point, dist } from "../geom/math";

export enum GridDisplayScalingType {
    EqualMargins,
    TopLeft,
    CenterOrigin,
}

export class GridDisplay extends EventTarget {
    grid: Grid;
    container: HTMLElement;
    element: HTMLDivElement;
    gridElement: HTMLDivElement;

    svg: SVGElement;
    svgGrid: SVGElement;
    svgTiles: SVGElement;

    coordinateMapper: CoordinateMapper;

    tileDisplays: Map<Tile, TileDisplay>;
    connectorDisplay: ConnectorDisplay;
    // backgroundGrid: BackgroundGrid;

    onAddTile: EventListener;
    onUpdateTileColors: EventListener;
    onRemoveTile: EventListener;

    rescaleTimeout: number;

    // TODO compute
    contentMinXNoPlaceholders: number;
    contentMinYNoPlaceholders: number;
    contentMaxXNoPlaceholders: number;
    contentMaxYNoPlaceholders: number;

    viewBoxMinX: number;
    viewBoxMinY: number;
    viewBoxWidth: number;
    viewBoxHeight: number;

    visibleLeft: number;
    visibleRight: number;
    visibleTop: number;
    visibleBottom: number;

    scale: number;
    // margins in pixels
    margins = { top: 30, right: 30, bottom: 30, left: 30 };
    scalingType = GridDisplayScalingType.EqualMargins;

    constructor(grid: Grid, container: HTMLElement) {
        super();
        this.grid = grid;
        this.container = container;

        this.tileDisplays = new Map<Tile, TileDisplay>();

        this.build();

        this.onAddTile = (evt: GridEvent) => this.addTile(evt.tile);
        this.onUpdateTileColors = (evt: GridEvent) => {
            const tileDisplay = this.tileDisplays.get(evt.tile);
            if (tileDisplay) {
                tileDisplay.updateColors();
            }
        };
        this.onRemoveTile = (evt: GridEvent) => this.removeTile(evt.tile);

        this.grid.addEventListener(GridEventType.AddTile, this.onAddTile);
        this.grid.addEventListener(
            GridEventType.UpdateTileColors,
            this.onUpdateTileColors,
        );
        this.grid.addEventListener(GridEventType.RemoveTile, this.onRemoveTile);

        for (const tile of this.grid.tiles) {
            this.addTile(tile);
        }

        this.styleMainElement();
    }

    build() {
        const div = document.createElement("div");
        this.element = div;

        const gridElement = document.createElement("div");
        gridElement.className = "grid";
        this.gridElement = gridElement;
        this.element.appendChild(gridElement);

        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
        );
        this.gridElement.appendChild(svg);
        this.svg = svg;

        this.svgGrid = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        this.svgGrid.setAttribute("class", "svg-grid");
        this.svg.appendChild(this.svgGrid);

        this.coordinateMapper = new CoordinateMapper();
        this.svgGrid.appendChild(this.coordinateMapper.svgGroup);

        this.svgTiles = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        this.svgTiles.setAttribute("class", "svg-tiles");
        this.svgGrid.appendChild(this.svgTiles);
    }

    destroy() {
        for (const td of this.tileDisplays.values()) {
            td.destroy();
        }
        if (this.connectorDisplay) {
            this.connectorDisplay.destroy();
            this.connectorDisplay = null;
        }
        /*
        if (this.backgroundGrid) {
            this.backgroundGrid.destroy();
            this.backgroundGrid = null;
        }
        */

        this.grid.removeEventListener(GridEventType.AddTile, this.onAddTile);
        this.grid.removeEventListener(
            GridEventType.UpdateTileColors,
            this.onUpdateTileColors,
        );
        this.grid.removeEventListener(
            GridEventType.RemoveTile,
            this.onRemoveTile,
        );
        this.container.remove();
        this.element.remove();
        this.gridElement.remove();
        this.svg.remove();
        this.svgGrid.remove();
        this.svgTiles.remove();
        this.coordinateMapper.destroy();
    }

    addTile(tile: Tile) {
        if (!this.tileDisplays.has(tile)) {
            const tileDisplay = new TileDisplay(this, tile);
            this.tileDisplays.set(tile, tileDisplay);
            this.svgTiles.appendChild(tileDisplay.element);
        }
        this.updateDimensions();
    }

    removeTile(tile: Tile) {
        const td = this.tileDisplays.get(tile);
        if (!td) return;
        this.tileDisplays.delete(tile);
        this.svgTiles.removeChild(td.element);
        this.updateDimensions();
    }

    updateDimensions() {
        if (this.grid.tiles.size == 0) return;

        /*
        // compute the extent of the content
        const tiles = [...this.grid.tiles.values()];
        this.contentMinX = Math.min(...tiles.map((t) => t.left));
        this.contentMinY = Math.min(...tiles.map((t) => t.top));
        this.contentMaxX = Math.max(...tiles.map((t) => t.left + t.width));
        this.contentMaxY = Math.max(...tiles.map((t) => t.top + t.height));

        const noPlaceholders = this.grid.getTilesWithType(TileType.NormalTile);
        this.contentMinXNoPlaceholders = Math.min(
            ...noPlaceholders.map((t) => t.left),
        );
        this.contentMinYNoPlaceholders = Math.min(
            ...noPlaceholders.map((t) => t.top),
        );
        this.contentMaxXNoPlaceholders = Math.max(
            ...noPlaceholders.map((t) => t.left + t.width),
        );
        this.contentMaxYNoPlaceholders = Math.max(
            ...noPlaceholders.map((t) => t.top + t.height),
        );
        */

        this.triggerRescale();
    }

    /**
     * Returns the screen coordinates of the triangle center.
     * @param triangle the triangle
     * @returns the pixel coordinates
     */
    /*
    triangleToScreenPosition(triangle: Triangle): Coord {
        const triangleCenter = triangle.center;
        return this.coordinateMapper.gridToScreen([
            triangle.left + triangleCenter[0],
            triangle.top + triangleCenter[1],
        ]);
    }
    */

    /**
     * Maps the client position (from getBoundingClient rect) to the SVG grid coordinates.
     * @param clientPos the client position
     * @returns the coordinates in the SVG grid space
     */
    screenPositionToGridPosition(clientPos: Point): Point {
        return this.coordinateMapper.screenToGrid(clientPos);
    }

    /**
     * Maps the client position (from getBoundingClient rect) to a triangle.
     * @param clientPos the client position
     * @returns the triangle coordinates
     */
    /*
    screenPositionToTriangleCoord(clientPos: Coord): Coord {
        const gridCoord = this.coordinateMapper.screenToGrid(clientPos);
        return this.grid.gridPositionToTriangleCoord(gridCoord);
    }
    */

    styleMainElement() {
        return;
    }

    /**
     * Returns the dimensions of the content area (i.e., the display coordinates
     * of the triangles to be shown on screen.)
     * @returns the minimum dimensions
     */
    protected computeDimensionsForRescale(): BBox {
        return this.grid.bbox;
    }

    /**
     * Trigger a rescale after a brief delay.
     */
    triggerRescale(timeout?: number) {
        if (this.rescaleTimeout) window.clearTimeout(this.rescaleTimeout);
        this.rescaleTimeout = window.setTimeout(
            () => this.rescale(),
            timeout || 10,
        );
    }

    /**
     * Rescale the grid based on the container size.
     */
    rescale() {
        const availWidth = (this.container || document.documentElement)
            .clientWidth;
        const availHeight = (this.container || document.documentElement)
            .clientHeight;
        const dim = this.computeDimensionsForRescale();
        if (availWidth === 0 || availHeight === 0) return;

        const gridBBox = this.grid.bbox;

        // compute the width and height of the content
        // TODO margins
        const contentWidth = dim.maxX - dim.minX;
        const contentHeight = dim.maxY - dim.minY;

        // compute the scale that makes the content fit the container
        const scale = Math.min(
            (availWidth - this.margins.left - this.margins.right) /
                contentWidth,
            (availHeight - this.margins.top - this.margins.bottom) /
                contentHeight,
        );
        const finalWidth = contentWidth * scale;
        const finalHeight = contentHeight * scale;

        // make sure we can fill the container
        let viewBoxMinX = gridBBox.minX;
        let viewBoxMinY = gridBBox.minY;
        let viewBoxWidth = gridBBox.maxX - gridBBox.minX;
        let viewBoxHeight = gridBBox.maxY - gridBBox.minY;
        if (viewBoxWidth * scale < availWidth) {
            const adjustX = availWidth / scale - viewBoxWidth;
            viewBoxMinX -= adjustX / 2;
            viewBoxWidth += adjustX;
        }
        if (viewBoxHeight * scale < availHeight) {
            const adjustY = availHeight / scale - viewBoxHeight;
            viewBoxMinY -= adjustY / 2;
            viewBoxHeight += adjustY;
        }
        this.viewBoxMinX = viewBoxMinX;
        this.viewBoxMinY = viewBoxMinY;
        this.viewBoxWidth = viewBoxWidth;
        this.viewBoxHeight = viewBoxHeight;

        // shift the origin to center the content in the container
        let containerLeft: number;
        let containerTop: number;
        switch (this.scalingType) {
            case GridDisplayScalingType.CenterOrigin:
                containerLeft = availWidth / 2;
                containerTop = availHeight / 2;
                break;
            case GridDisplayScalingType.TopLeft:
                containerLeft = -dim.minX * scale;
                containerTop = -dim.minY * scale;
                break;
            case GridDisplayScalingType.EqualMargins:
            default:
                containerLeft =
                    (availWidth - finalWidth) / 2 - dim.minX * scale;
                containerTop =
                    (availHeight - finalHeight) / 2 - dim.minY * scale;
        }

        // compute the area that is visible on screen
        this.visibleLeft = -containerLeft / scale;
        this.visibleRight = (availWidth + containerLeft) / scale;
        this.visibleTop = -containerTop / scale;
        this.visibleBottom = (availHeight + containerTop) / scale;

        this.svgGrid.style.transform = `translate(${containerLeft}px, ${containerTop}px) scale(${scale})`;
        console.log(
            "update svgGrid.style.transform",
            this.svgGrid.style.transform,
        );

        this.scale = scale;

        this.coordinateMapper.resetCoeffCache();

        // update the background grid
        /*
        if (this.backgroundGrid) {
            this.backgroundGrid.redraw(
                viewBoxMinX,
                viewBoxMinY,
                viewBoxWidth,
                viewBoxHeight,
            );
        }
        */

        if (!this.element.classList.contains("animated")) {
            window.setTimeout(() => {
                this.element.classList.add("animated");
            }, 1000);
        }
    }
}

export class TileStackGridDisplay extends GridDisplay {
    margins = { top: 0, right: 0, bottom: 0, left: 0 };

    styleMainElement() {
        const div = this.element;
        div.className = "tileStack-gridDisplay";
        div.style.zIndex = "1000";
    }

    /**
     * Returns the dimensions of the content area (e.g., the display coordinates
     * of the triangles to be shown on screen.)
     * @returns the minimum dimensions
     */
    protected computeDimensionsForRescale(): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } {
        // diameter of a circle around the tile points,
        // with the mean as the center
        const bbox = this.grid.bbox;
        const centroid = this.grid.centroid;
        let maxDist = Math.max(
            ...this.grid.tiles
                .values()
                .flatMap((t) => t.polygon.vertices)
                .map((v) => dist(v, centroid)),
        );
        // compensation for almost-circular tiles, which would be too close to the edge otherwise
        maxDist = Math.max(0.6 * (bbox.maxX - bbox.minX), maxDist);
        return {
            minX: centroid.x - maxDist,
            minY: centroid.y - maxDist,
            maxX: centroid.x + maxDist,
            maxY: centroid.y + maxDist,
        };
    }
}

export class MainMenuGridDisplay extends GridDisplay {
    margins = { top: 0, right: 0, bottom: 0, left: 0 };

    styleMainElement() {
        const div = this.element;
        div.className = "mainMenu-gridDisplay gridDisplay";
    }
}

type ScreenToGridCoeff = {
    x0: number;
    y0: number;
    scale: number;
    dxdx: number;
    dydx: number;
    dxdy: number;
    dydy: number;
};

class CoordinateMapper {
    svgGroup: SVGElement;
    svgUnitCircle00: SVGElement;
    svgUnitCircle01: SVGElement;
    svgUnitCircle10: SVGElement;

    private _coeffCache: ScreenToGridCoeff;

    constructor() {
        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        group.setAttribute("name", "svg-CoordinateMapper");
        this.svgGroup = group;

        // measurement circles
        const unitCircle00 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
        );
        unitCircle00.setAttribute("cx", "0");
        unitCircle00.setAttribute("cy", "0");
        unitCircle00.setAttribute("r", "1");
        unitCircle00.setAttribute("fill", "transparent");
        group.appendChild(unitCircle00);
        this.svgUnitCircle00 = unitCircle00;

        const unitCircle01 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
        );
        unitCircle01.setAttribute("cx", "0");
        unitCircle01.setAttribute("cy", "1");
        unitCircle01.setAttribute("r", "1");
        unitCircle01.setAttribute("fill", "transparent");
        group.appendChild(unitCircle01);
        this.svgUnitCircle01 = unitCircle01;

        const unitCircle10 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
        );
        unitCircle10.setAttribute("cx", "1");
        unitCircle10.setAttribute("cy", "0");
        unitCircle10.setAttribute("r", "1");
        unitCircle10.setAttribute("fill", "transparent");
        group.appendChild(unitCircle10);
        this.svgUnitCircle10 = unitCircle10;
    }

    destroy() {
        this.svgGroup.remove();
    }

    resetCoeffCache() {
        this._coeffCache = null;
    }

    updateCoeffCache(dx: number, dy: number) {
        if (this._coeffCache) {
            this._coeffCache.x0 += dx;
            this._coeffCache.y0 += dy;
        }
    }

    private get coeff(): ScreenToGridCoeff {
        if (!this._coeffCache) {
            const rect00 = this.svgUnitCircle00.getBoundingClientRect();
            const rect01 = this.svgUnitCircle01.getBoundingClientRect();
            const rect10 = this.svgUnitCircle10.getBoundingClientRect();
            this._coeffCache = {
                x0: rect00.left,
                y0: rect00.top,
                scale: rect00.width / 2,
                dxdx: rect10.left - rect00.left,
                dydx: rect10.top - rect00.top,
                dxdy: rect01.left - rect00.left,
                dydy: rect01.top - rect00.top,
            };
        }
        return this._coeffCache;
    }

    gridToScreen(gridPos: Point): Point {
        const coeff = this.coeff;
        const x = gridPos.x;
        const y = gridPos.y;
        return {
            x: x * coeff.dxdx + y * coeff.dxdy + coeff.x0,
            y: x * coeff.dydx + y * coeff.dydy + coeff.y0,
        };
    }

    screenToGrid(screenPos: Point): Point {
        const coeff = this.coeff;
        const s = coeff.dydx * coeff.dxdy - coeff.dxdx * coeff.dydy;
        const x = (screenPos[0] - coeff.x0) / s;
        const y = (screenPos[1] - coeff.y0) / s;
        return {
            x: -x * coeff.dydy + y * coeff.dxdy,
            y: x * coeff.dydx - y * coeff.dxdx,
        };
    }
}

/*
class BackgroundGrid {
    grid: Grid;
    triangle: Triangle;

    element: SVGElement;

    dxdx: number;
    dydx: number;
    dxdy: number;
    dydy: number;
    bboxMinX: number;
    bboxMinY: number;
    bboxMaxX: number;
    bboxMaxY: number;

    drawn: Set<CoordId>;

    constructor(grid: Grid) {
        this.grid = grid;
        this.triangle = grid.getOrAddTriangle(0, 0);
        this.drawn = new Set<CoordId>();

        this.build();
        this.redraw(0, 0, 1, 1);
    }

    build() {
        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        group.setAttribute("class", "svg-backgroungGrid");
        this.element = group;

        // make the tile a bit larger than the minimum period
        const repeatX = 3;
        const repeatY = 3;

        const allPoints: Coord[] = [];
        const pathComponents: string[] = [];
        for (let x = 0; x < repeatX * this.triangle.tileGridPeriodX; x++) {
            for (let y = 0; y < repeatX * this.triangle.tileGridPeriodY; y++) {
                const params = this.triangle.getGridParameters(x, y);
                allPoints.push(
                    ...params.points.map(
                        (c): Coord => [
                            (c[0] + params.left) * SCALE,
                            (c[1] + params.top) * SCALE,
                        ],
                    ),
                );
                const pointsString = params.points.map(
                    (p) =>
                        `${(p[0] + params.left) * SCALE},${(p[1] + params.top) * SCALE}`,
                );
                pathComponents.push(
                    `M ${pointsString[0]} L ${pointsString.slice(1).join(" ")} Z`,
                );
            }
        }
        this.bboxMinX = Math.min(...allPoints.map((c) => c[0]));
        this.bboxMinY = Math.min(...allPoints.map((c) => c[1]));
        this.bboxMaxX = Math.max(...allPoints.map((c) => c[0]));
        this.bboxMaxY = Math.max(...allPoints.map((c) => c[1]));

        // draw the initial pattern
        const outline = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
        );
        outline.setAttribute("id", "background-grid-pattern");
        outline.setAttribute("d", pathComponents.join(" "));
        outline.setAttribute("fill", "transparent");
        outline.setAttribute("stroke", "#ccc");
        outline.setAttribute("stroke-width", "1px");
        outline.setAttribute("stroke-linejoin", "round");
        outline.setAttribute("stroke-linecap", "round");
        outline.setAttribute("vector-effect", "non-scaling-stroke");
        this.element.append(outline);
        this.drawn.add(CoordId(0, 0));

        // find out where to repeat it
        const params00 = this.triangle.getGridParameters(0, 0);
        const params01 = this.triangle.getGridParameters(
            0,
            repeatY * this.triangle.tileGridPeriodY,
        );
        const params10 = this.triangle.getGridParameters(
            repeatX * this.triangle.tileGridPeriodX,
            0,
        );
        this.dxdx = params10.left - params00.left;
        this.dydx = params10.top - params00.top;
        this.dxdy = params01.left - params00.left;
        this.dydy = params01.top - params00.top;
    }

    redraw(
        screenMinX: number,
        screenMinY: number,
        screenWidth: number,
        screenHeight: number,
    ) {
        for (let x = -10; x < 10; x++) {
            for (let y = -10; y < 10; y++) {
                const posX = SCALE * (x * this.dxdx + y * this.dxdy);
                const posY = SCALE * (x * this.dydx + y * this.dydy);
                const bboxLeft = posX + this.bboxMinX;
                const bboxRight = posX + this.bboxMaxX;
                const bboxTop = posY + this.bboxMinY;
                const bboxBottom = posY + this.bboxMaxY;
                // inside?
                if (
                    bboxLeft <= screenMinX + screenWidth &&
                    bboxRight >= screenMinX &&
                    bboxTop <= screenMinY + screenHeight &&
                    bboxBottom >= screenMinY &&
                    !this.drawn.has(CoordId(x, y))
                ) {
                    // yes: draw!
                    const outline2 = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "use",
                    );
                    outline2.setAttribute("href", "#background-grid-pattern");
                    outline2.setAttribute("x", `${posX}`);
                    outline2.setAttribute("y", `${posY}`);
                    this.element.append(outline2);
                    this.drawn.add(CoordId(x, y));
                }
            }
        }
    }

    destroy() {
        this.element.remove();
    }
}
*/
