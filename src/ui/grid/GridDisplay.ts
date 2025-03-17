import { TileDisplay } from "./TileDisplay";
import { Grid } from "../../grid/Grid";
import { GridEvent, GridEventType } from "../../grid/GridEvent";
import { PlaceholderTile, Tile } from "../../grid/Tile";
import { Shape } from "../../grid/Shape";
import { BBox, Point } from "../../geom/math";
import { TransformComponent, TransformList } from "../../geom/Transform";
import { S, SVG } from "../shared/svg";
import { createElement } from "../shared/html";

export const enum GridDisplayScalingType {
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
    svgPlaceholders: SVGElement;

    animated = true;

    tileDisplays: Map<Tile, TileDisplay>;
    // connectorDisplay: ConnectorDisplay;
    // backgroundGrid: BackgroundGrid;

    onAddTile: EventListener;
    onUpdateTileColors: EventListener;
    onRemoveTile: EventListener;

    rescaleTimeout?: number;

    viewBoxMinX?: number;
    viewBoxMinY?: number;
    viewBoxWidth?: number;
    viewBoxHeight?: number;

    visibleLeft?: number;
    visibleRight?: number;
    visibleTop?: number;
    visibleBottom?: number;

    scale: number = 1;
    containerLeft: number = 0;
    containerTop: number = 0;
    // margins in pixels
    margins = { top: 30, right: 30, bottom: 30, left: 30 };
    scalingType = GridDisplayScalingType.EqualMargins;

    baseTransform: TransformComponent;
    containerTransform: TransformComponent;
    parentTransforms: TransformList;

    constructor(grid: Grid, container: HTMLElement) {
        super();
        this.grid = grid;
        this.container = container;

        this.containerTransform = {};
        this.baseTransform = {};
        this.parentTransforms = new TransformList(
            this.containerTransform,
            this.baseTransform,
        );

        this.tileDisplays = new Map<Tile, TileDisplay>();

        const div = createElement("div", "grid-display");
        this.element = div;

        const gridEl = (this.gridElement = createElement("div", "grid", div));
        const svg = (this.svg = SVG("svg", null, gridEl));
        const svgGrid = (this.svgGrid = SVG("g", "svg-grid", svg));
        this.svgPlaceholders = SVG("g", "svg-placeholders", svgGrid);
        this.svgTiles = SVG("g", "svg-tiles", svgGrid);

        this.onAddTile = (evt: GridEvent) => this.addTile(evt.tile!);
        this.onUpdateTileColors = (evt: GridEvent) => {
            const tileDisplay = this.tileDisplays.get(evt.tile!);
            if (tileDisplay) {
                tileDisplay.updateColors();
            }
        };
        this.onRemoveTile = (evt: GridEvent) => this.removeTile(evt.tile!);

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

    destroy() {
        for (const td of this.tileDisplays.values()) {
            td.destroy();
        }

        this.grid.removeEventListener(GridEventType.AddTile, this.onAddTile);
        this.grid.removeEventListener(
            GridEventType.UpdateTileColors,
            this.onUpdateTileColors,
        );
        this.grid.removeEventListener(
            GridEventType.RemoveTile,
            this.onRemoveTile,
        );

        this.element.remove();
        this.gridElement.remove();
        this.svg.remove();
        this.svgGrid.remove();
        this.svgTiles.remove();
        this.svgPlaceholders.remove();
    }

    addTile(tile: Tile) {
        if (!this.tileDisplays.has(tile)) {
            const tileDisplay = new TileDisplay(this, tile);
            this.tileDisplays.set(tile, tileDisplay);
            if (tile instanceof PlaceholderTile) {
                this.svgPlaceholders.appendChild(tileDisplay.element);
            } else {
                this.svgTiles.appendChild(tileDisplay.element);
            }
        }
        this.updateDimensions();
    }

    removeTile(tile: Tile) {
        const td = this.tileDisplays.get(tile);
        if (!td) return;
        this.tileDisplays.delete(tile);
        td.element.remove();
        td.destroy();
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
    ): {
        tile: Tile;
        offset?: number;
        dist: number;
        matchesPoints: boolean;
    } | null {
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
    protected computeDimensionsForRescale(): BBox | undefined | null {
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
        if (!dim || availWidth === 0 || availHeight === 0) return;

        const gridBBox = this.grid.bbox;
        if (!gridBBox) return;

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
        let viewBoxMinX = gridBBox.minX * S;
        let viewBoxMinY = gridBBox.minY * S;
        let viewBoxWidth = (gridBBox.maxX - gridBBox.minX) * S;
        let viewBoxHeight = (gridBBox.maxY - gridBBox.minY) * S;
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

        // Firefox doesn't like large scale with animations
        this.svgGrid.style.transform = `translate(${containerLeft}px, ${containerTop}px) scale(${scale / S})`;

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

        if (
            this.animated &&
            !this.element.classList.contains("grid-display-animated")
        ) {
            window.setTimeout(() => {
                this.element.classList.add("grid-display-animated");
            }, 1000);
        }
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
        const group = SVG("g", "svg-backgroundGrid", this.element);

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
        const outline = SVG("path", null, this.element, {
            id: "background-grid-pattern",
            d: pathComponents.join(" "),
            fill: "transparent",
            stroke: "#ccc",
            "stroke-width": "1px",
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
            "vector-effect": "non-scaling-stroke",
        });
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
                    const outline2 = SVG("use", null, this.element, {
                        href: "#background-grid-pattern",
                        x: `${posX}`,
                        y: `${posY}`,
                    });
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
