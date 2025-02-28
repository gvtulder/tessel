import type { Interactable } from "@interactjs/types";

import { roundPathCorners } from "../lib/svg-rounded-corners";
import { Tile, TileType } from "src/geom/Tile";
import { DEBUG, PLACEHOLDER, SCALE } from "../settings";
import { GridDisplay } from "./GridDisplay";
import offsetPolygon from "../lib/offset-polygon";
import { addPointToPolygon, dist, Point } from "../geom/math";

function polygonToPath(vertices: readonly Point[]): string {
    const points = new Array<string>(vertices.length);
    for (let i = 0; i < points.length; i++) {
        points[i] = `${vertices[i].x} ${vertices[i].y}`;
    }
    return "M ".concat(points.join(" L ")).concat(" Z");
}

export type TileOnScreenMatch = {
    moving: Tile;
    fixed: Tile;
};

export class TileDisplay {
    tile: Tile;

    gridDisplay: GridDisplay;
    segmentElements: SVGPathElement[];

    element: SVGElement;

    constructor(gridDisplay: GridDisplay, tile: Tile) {
        this.gridDisplay = gridDisplay;
        this.tile = tile;
        this.build();
    }

    build() {
        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        const className = "svg-tile";
        /*
        if (this.tile.type === TileType.PatternExample) {
            className = `${className} svg-tile-PatternExample`;
        }
        */
        group.setAttribute("class", className);
        this.element = group;

        this.redraw();
    }

    destroy() {
        this.element.remove();
    }

    redraw() {
        this.drawSegments();
        this.drawOutline();
    }

    updateColors() {
        if (!this.tile.segments) return;
        const segments = this.tile.segments;
        const elements = this.segmentElements;
        for (let i = 0; i < segments.length; i++) {
            elements[i].setAttribute("fill", segments[i].color || PLACEHOLDER);
        }
    }

    drawSegments() {
        if (!this.tile.segments) return;
        const segments = this.tile.segments;
        const segmentElements = (this.segmentElements =
            new Array<SVGPathElement>(segments.length));
        for (let i = 0; i < segments.length; i++) {
            let poly = segments[i].polygon.vertices;
            if (i < segments.length - 1) {
                // overlap with next segment, which is drawn on top of this segment
                poly = addPointToPolygon(
                    poly,
                    segments[(i + 1) % segments.length].polygon.centroid,
                );
            }
            if (i == 0) {
                // for the first segment, also overlap with the final segment
                poly = addPointToPolygon(
                    poly,
                    segments[segments.length - 1].polygon.centroid,
                );
            }
            const polyElement = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
            );
            polyElement.setAttribute("fill", segments[i].color || PLACEHOLDER);
            polyElement.setAttribute("d", polygonToPath(poly));
            this.element.appendChild(polyElement);
            segmentElements[i] = polyElement;
        }
        /*
        // add in correct order to make the overlapping work
        const sortedTriangles = [...this.tile.triangles].sort((a, b) => {
            return a.top.toFixed(2) != b.top.toFixed(2)
                ? a.top - b.top
                : a.left - b.left || a.height - b.height;
        });
        for (const c of [...this.element.childNodes]) {
            this.element.removeChild(c);
        }
        for (const triangle of sortedTriangles) {
            let triangleDisplay = this.triangleDisplays.get(triangle);
            if (!triangleDisplay) {
                triangleDisplay = new TriangleDisplay(triangle);
                this.triangleDisplays.set(triangle, triangleDisplay);
                this.gridDisplay.triangleDisplays.set(
                    triangle,
                    triangleDisplay,
                );
            }
            const left = ((triangle.left - this.tile.left) * SCALE).toFixed(5);
            const top = ((triangle.top - this.tile.top) * SCALE).toFixed(5);
            triangleDisplay.element.setAttribute(
                "transform",
                `translate(${left} ${top})`,
            );
            this.element.appendChild(triangleDisplay.element);
        }
        const removedTriangles = [...this.triangleDisplays.keys()].filter(
            (t) => t.tile !== this.tile,
        );
        for (const triangle of removedTriangles) {
            this.triangleDisplays.get(triangle).destroy();
            this.triangleDisplays.delete(triangle);
            this.gridDisplay.triangleDisplays.delete(triangle);
        }
        */
    }

    drawOutline() {
        // shrink outline
        const outline = offsetPolygon(this.tile.polygon.vertices, -0.03);
        // outline = shrinkOutline(outline, 0.95);

        let path = outline.map((p) => `${p.x} ${p.y}`).join(" L ");
        path = `M ${path} Z`;
        path = polygonToPath(outline);
        const roundPath = roundPathCorners(path, 0.08, false);

        if (
            this.tile.tileType == TileType.Placeholder ||
            !this.tile.segments ||
            this.tile.segments.length == 0
        ) {
            // placeholder
            const outline = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
            );
            outline.setAttribute("d", roundPath);
            outline.setAttribute("fill", PLACEHOLDER);
            if (DEBUG.HIDE_TILE_OUTLINE) {
                outline.setAttribute("fill-opacity", "0.0");
            } else {
                outline.setAttribute("fill-opacity", "0.5");
            }
            outline.setAttribute("stroke", PLACEHOLDER);
            this.element.appendChild(outline);
        } else {
            if (DEBUG.HIDE_TILE_OUTLINE) return;
            this.element.setAttribute(
                "clip-path",
                `path('${roundPath}') view-box`,
            );
        }
    }

    hide() {
        this.element.classList.add("hide");
    }

    highlightHint(ok: boolean) {
        this.element.classList.toggle("highlight-hint-ok", ok);
        this.element.classList.toggle("highlight-hint-notok", !ok);
    }

    removeHighlightHint() {
        this.element.classList.remove("highlight-hint-ok");
        this.element.classList.remove("highlight-hint-notok");
    }
}
