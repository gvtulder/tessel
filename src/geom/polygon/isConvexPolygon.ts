/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Point } from "../math";

const EPS = 1e-6;

/**
 * Checks if the polygon is convex.
 */
export function isConvexPolygon(vertices: readonly Point[]): boolean {
    // based on pseudocode from
    // https://math.stackexchange.com/a/1745427 (CC BY-SA 3.0)

    const n = vertices.length;
    if (n < 3) return false;

    // First nonzero orientation (positive or negative)
    let wSign = 0;
    let xSign = 0;
    // Sign of first nonzero edge vector x
    let xFirstSign = 0;
    // Number of sign changes in x
    let xFlips = 0;

    let ySign = 0;
    // Sign of first nonzero edge vector y
    let yFirstSign = 0;
    // Number of sign changes in y
    let yFlips = 0;

    // Second-to-last vertex
    let curr = vertices[n - 2];
    // Last vertex
    let next = vertices[n - 1];

    for (const v of vertices) {
        // Previous vertex
        const prev = curr;
        // Current vertex
        curr = next;
        // Next vertex
        next = v;

        // Previous edge vector ("before"):
        const bx = curr.x - prev.x;
        const by = curr.y - prev.y;

        // Next edge vector ("after"):
        const ax = next.x - curr.x;
        const ay = next.y - curr.y;

        // Calculate sign flips using the next edge vector ("after"),
        // recording the first sign.
        if (ax > EPS) {
            if (xSign == 0) {
                xFirstSign = +1;
            } else if (xSign < 0) {
                xFlips++;
            }
            xSign = +1;
        } else if (ax < -EPS) {
            if (xSign == 0) {
                xFirstSign = -1;
            } else if (xSign > 0) {
                xFlips++;
            }
            xSign = -1;
        }

        if (xFlips > 2) {
            return false;
        }

        if (ay > EPS) {
            if (ySign == 0) {
                yFirstSign = +1;
            } else if (ySign < 0) {
                yFlips++;
            }
            ySign = +1;
        } else if (ay < EPS) {
            if (ySign == 0) {
                yFirstSign = -1;
            } else if (ySign > 0) {
                yFlips++;
            }
            ySign = -1;
        }

        if (yFlips > 2) {
            return false;
        }

        // Find out the orientation of this pair of edges,
        // and ensure it does not differ from previous ones.
        const w = bx * ay - ax * by;
        if (wSign == 0 && Math.abs(w) > EPS) {
            wSign = w;
        } else if (wSign > 0 && w < -EPS) {
            return false;
        } else if (wSign < 0 && w > EPS) {
            return false;
        }
    }

    // Final/wraparound sign flips:
    if (xSign != 0 && xFirstSign != 0 && xSign != xFirstSign) {
        xFlips++;
    }
    if (ySign != 0 && yFirstSign != 0 && ySign != yFirstSign) {
        yFlips++;
    }

    // Concave polygons have two sign flips along each axis.
    if (xFlips != 2 || yFlips != 2) {
        return false;
    }

    return true;
}
