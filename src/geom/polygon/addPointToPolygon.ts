/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Point, distToLineSegment } from "../math";

/**
 * Adds a point to the polygon, splitting the nearest edge.
 */
export function addPointToPolygon(
    points: readonly Point[],
    newPoint: Point,
): Point[] {
    const n = points.length;
    let nearestEdgeDist = 0;
    let nearestEdge = null;
    for (let i = 0; i < n; i++) {
        const d = distToLineSegment(points[i], points[(i + 1) % n], newPoint);
        if (nearestEdge === null || d < nearestEdgeDist) {
            nearestEdgeDist = d;
            nearestEdge = i;
        }
    }
    const newPoints = [...points];
    newPoints.splice((nearestEdge as number) + 1, 0, newPoint);
    return newPoints;
}
