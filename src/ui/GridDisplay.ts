import { TileDisplay } from "./TileDisplay";
import { Grid } from "../geom/Grid";
import { GridEvent, GridEventType } from "../geom/GridEvent";
import { Tile } from "../geom/Tile";
import { Shape } from "../geom/Shape";
import { DEBUG } from "../settings";
import { BBox, Point, dist } from "../geom/math";
import { TransformComponent, TransformList } from "../geom/Transform";
import { SVG } from "./svg";

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

    tileDisplays: Map<Tile, TileDisplay>;
    // connectorDisplay: ConnectorDisplay;
    // backgroundGrid: BackgroundGrid;

    onAddTile: EventListener;
    onUpdateTileColors: EventListener;
    onRemoveTile: EventListener;

    rescaleTimeout: number;

    viewBoxMinX: number;
    viewBoxMinY: number;
    viewBoxWidth: number;
    viewBoxHeight: number;

    visibleLeft: number;
    visibleRight: number;
    visibleTop: number;
    visibleBottom: number;

    scale: number;
    containerLeft: number;
    containerTop: number;
    // margins in pixels
    margins = { top: 30, right: 30, bottom: 30, left: 30 };
    scalingType = GridDisplayScalingType.EqualMargins;

    containerTransform: TransformComponent;
    parentTransforms: TransformList;

    constructor(grid: Grid, container: HTMLElement) {
        super();
        this.grid = grid;
        this.container = container;

        this.containerTransform = {};
        this.parentTransforms = new TransformList(this.containerTransform);

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

        for (const tile of this.grid.placeholders) {
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

        const svg = SVG("svg");
        this.gridElement.appendChild(svg);
        this.svg = svg;

        this.svgGrid = SVG("g");
        this.svgGrid.setAttribute("class", "svg-grid");
        this.svg.appendChild(this.svgGrid);

        this.svgTiles = SVG("g");
        this.svgTiles.setAttribute("class", "svg-tiles");
        this.svgGrid.appendChild(this.svgTiles);
    }

    destroy() {
        for (const td of this.tileDisplays.values()) {
            td.destroy();
        }
        /*
        if (this.connectorDisplay) {
            this.connectorDisplay.destroy();
            this.connectorDisplay = null;
        }
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
        this.triggerRescale();
    }

    /**
     * Maps the client position (from getBoundingClient rect) to the SVG grid coordinates.
     */
    gridToScreenPosition(gridPos: Point): Point {
        return this.parentTransforms.applyForward(gridPos);
    }

    /**
     * Maps the client position (from getBoundingClient rect) to the SVG grid coordinates.
     */
    gridToScreenPositions(gridPos: readonly Point[]): Point[] {
        return gridPos.map((p) => this.parentTransforms.applyForward(p));
    }

    /**
     * Maps the client position (from getBoundingClient rect) to the SVG grid coordinates.
     */
    screenToGridPosition(clientPos: Point): Point {
        return this.parentTransforms.applyBackward(clientPos);
    }

    /**
     * Maps the client position (from getBoundingClient rect) to the SVG grid coordinates.
     */
    screenToGridPositions(clientPos: readonly Point[]): Point[] {
        return clientPos.map((p) => this.parentTransforms.applyBackward(p));
    }

    /**
     * Finds the best overlapping tile for the given polygon points.
     * @param points the vertices of a polygon
     * @param minOverlap the minimal overlap proportion
     * @param includePlaceholders set to true to match placeholder tiles
     * @param shape only match tiles with this shape
     * @param matchCentroidOnly set to true match on centroid, not all points
     * @returns the best matching tile and offset, or null
     */
    findMatchingTile(
        points: readonly Point[],
        minOverlap: number,
        includePlaceholders?: boolean,
        shape?: Shape,
        matchCentroidOnly?: boolean,
    ): { tile: Tile; offset: number; dist: number } {
        return this.grid.findMatchingTile(
            points,
            minOverlap,
            includePlaceholders,
            shape,
            matchCentroidOnly,
        );
    }

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

        this.containerLeft = containerLeft;
        this.containerTop = containerTop;
        this.scale = scale;

        this.containerTransform.dx = containerLeft;
        this.containerTransform.dy = containerTop;
        this.containerTransform.scale = scale;

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
            ...[...this.grid.tiles.values()]
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
            SVG_NS,
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
            SVG_NS,
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
                        SVG_NS,
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
