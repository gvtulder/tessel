// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { intersection } from "polygon-clipping";
import { Point, area } from "../math";
import { Polygon } from "../Polygon";

/**
 * Return the overlap area between two polygons.
 * @returns the area of overlap (ignoring holes, if any)
 */
export function overlapArea(
    a: readonly Point[] | Polygon,
    b: readonly Point[] | Polygon,
): number {
    if (a instanceof Polygon) {
        a = a.vertices;
    }
    if (b instanceof Polygon) {
        b = b.vertices;
    }
    const intersect = intersection(
        [[a.map((p) => [p.x, p.y])]],
        [[b.map((p) => [p.x, p.y])]],
    );
    let sumArea = 0;
    // sum over all polygons
    for (const poly of intersect) {
        let polyA = 0;
        // take the area of the largest ring (ignore holes)
        for (const ring of poly) {
            const ringA = area(ring.map(([x, y]) => ({ x, y })));
            if (ringA > polyA) polyA = ringA;
        }
        sumArea += polyA;
    }
    return sumArea;
}
