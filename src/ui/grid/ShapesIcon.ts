/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { mergeBBoxItems } from "../../geom/math";
import { Polygon } from "../../geom/Polygon";
import { AngleUse, Shape } from "../../grid/Shape";
import offsetPolygon from "../../lib/offset-polygon";
import { roundPathCorners } from "../../lib/svg-rounded-corners";
import { S, SVG } from "../shared/svg";
import { polygonToPath } from "./TileDisplay";

export class AtlasIcon {
    svg: SVGElement;

    constructor(shapes: readonly Shape[]) {
        const polygons: Polygon[] = [];

        for (const shape of shapes) {
            if (polygons.length == 0) {
                polygons.push(
                    shape.constructPreferredPolygon(
                        0,
                        0,
                        1,
                        AngleUse.SetupAtlas,
                    ),
                );
            } else {
                polygons.push(
                    shape.constructPolygonEdge(
                        polygons[0].outsideEdges[polygons.length],
                        0,
                    ),
                );
            }
        }

        const svg = SVG("svg", "shapes-icon");
        for (const poly of polygons) {
            svg.appendChild(this.drawPolygon(poly));
        }

        const bbox = mergeBBoxItems(polygons)!;
        const viewBox = [
            bbox.minX,
            bbox.minY,
            bbox.maxX - bbox.minX,
            bbox.maxY - bbox.minY,
        ];
        // center in a square viewbox
        if (viewBox[2] < viewBox[3]) {
            viewBox[0] -= (viewBox[3] - viewBox[2]) / 2;
            viewBox[2] = viewBox[3];
        } else if (viewBox[2] > viewBox[3]) {
            viewBox[1] -= (viewBox[2] - viewBox[3]) / 2;
            viewBox[3] = viewBox[2];
        }
        svg.setAttribute(
            "viewBox",
            viewBox.map((x) => (x * S).toFixed(4)).join(" "),
        );

        this.svg = svg;
    }

    drawPolygon(polygon: Polygon): SVGPathElement {
        // shrink outline
        const outline = offsetPolygon(polygon.vertices, -0.03);
        // outline = shrinkOutline(outline, 0.95);

        const path = polygonToPath(outline);
        const roundPath = roundPathCorners(path, 0.08, true);

        return SVG("path", null, undefined, {
            d: roundPath,
        });
    }
}
