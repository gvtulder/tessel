/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { roundPathCorners } from "../../lib/svg-rounded-corners";
import { Tile, TileType } from "../../grid/Tile";
import { DEBUG } from "../../settings";
import { GridDisplay } from "./GridDisplay";
import offsetPolygon from "../../lib/offset-polygon";
import { Point } from "../../geom/math";
import { addPointToPolygon } from "../../geom/polygon/addPointToPolygon";
import { S, SVG } from "../shared/svg";
import { UniqueIdSource } from "../shared/uniqueSvgId";

function polygonToPath(vertices: readonly Point[]): string {
    const points = new Array<string>(vertices.length);
    for (let i = 0; i < points.length; i++) {
        points[i] =
            `${(S * vertices[i].x).toFixed(4)} ${(S * vertices[i].y).toFixed(4)}`;
    }
    return "M ".concat(points.join(" L ")).concat(" Z");
}

export type TileOnScreenMatch = {
    moving: Tile;
    fixed: Tile;
    offset: number;
};

const uniqueIdSource = new UniqueIdSource("tile");

export class TileDisplay {
    tile: Tile;

    gridDisplay: GridDisplay;
    segmentElements?: SVGPathElement[];

    element: SVGElement;
    clipPath: SVGElement;
    clipPathId: string;

    constructor(gridDisplay: GridDisplay, tile: Tile) {
        this.gridDisplay = gridDisplay;
        this.tile = tile;

        this.element = SVG(
            "g",
            tile.tileType === TileType.Placeholder
                ? "svg-placeholder"
                : "svg-tile",
        );
        this.clipPathId = uniqueIdSource.getUniqueIdPrefix();
        const clipPath = SVG("clipPath", null, this.element);
        clipPath.setAttribute("id", this.clipPathId);
        this.clipPath = SVG("path", null, clipPath);

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
        if (!this.tile.segments || !this.segmentElements) return;
        const segments = this.tile.segments;
        const elements = this.segmentElements;
        for (let i = 0; i < segments.length; i++) {
            elements[i].setAttribute("fill", segments[i].color || "");
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
            const polyElement = SVG("path");
            polyElement.setAttribute("fill", segments[i].color || "");
            polyElement.setAttribute("d", polygonToPath(poly));
            this.element.appendChild(polyElement);
            segmentElements[i] = polyElement;
        }
    }

    drawOutline() {
        // shrink outline
        const outline = offsetPolygon(this.tile.polygon.vertices, -0.03);
        // outline = shrinkOutline(outline, 0.95);

        const path = polygonToPath(outline);
        const roundPath = roundPathCorners(path, 0.08, true);

        if (
            this.tile.tileType == TileType.Placeholder ||
            !this.tile.segments ||
            this.tile.segments.length == 0
        ) {
            // placeholder
            const outline = SVG("path", null, this.element, {
                d: roundPath,
                "stroke-width": `${S * 0.01}`,
            });
        } else {
            if (DEBUG.HIDE_TILE_OUTLINE) return;
            // the view-box clip-path is not supported in older Android webviews,
            // so we use a clipPath element instead
            // this.element.setAttribute(
            //     "clip-path",
            //     `path('${roundPath}') view-box`,
            // );
            this.clipPath.setAttribute("d", roundPath);
            this.element.setAttribute("clip-path", `url(#${this.clipPathId})`);
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
