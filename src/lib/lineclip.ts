// SPDX-License-Identifier: ISC AND GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (c) 2015, Mapbox
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

// TypeScript port of https://github.com/mapbox/lineclip/
// original code:
// ISC License
// Copyright (c) 2015, Mapbox

type Point = {
    readonly x: number;
    readonly y: number;
};

type BBox = {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
};

type BitCode = number;

/**
 * Cohen-Sutherland line clippign algorithm, adapted to efficiently
 * handle polylines rather than just segments
 */
export function lineclip(
    points: readonly Point[],
    bbox: BBox,
    result?: Point[][],
): Point[][] {
    const len = points.length;
    let codeA = bitCode(points[0], bbox);
    let part: Point[] = [];

    if (!result) result = [];

    for (let i = 1; i < len; i++) {
        let a = points[i - 1];
        let b = points[i];
        let codeB = bitCode(b, bbox);
        const lastCode = codeB;

        while (true) {
            if (!(codeA | codeB)) {
                // accept
                part.push(a);

                if (codeB !== lastCode) {
                    // segment went outside
                    part.push(b);

                    if (i < len - 1) {
                        // start a new line
                        result.push(part);
                        part = [];
                    }
                } else if (i === len - 1) {
                    part.push(b);
                }
                break;
            } else if (codeA & codeB) {
                // trivial reject
                break;
            } else if (codeA) {
                // a outside, intersect with clip edge
                a = intersect(a, b, codeA, bbox);
                codeA = bitCode(a, bbox);
            } else {
                // b outside
                b = intersect(a, b, codeB, bbox);
                codeB = bitCode(b, bbox);
            }
        }

        codeA = lastCode;
    }

    if (part.length) result.push(part);

    return result;
}

/**
 * Sutherland-Hodgeman polygon clipping algorithm
 */
export function polygonclip(points: readonly Point[], bbox: BBox): Point[] {
    let result: Point[];

    // clip against each side of the clip rectangle
    for (let edge = 1; edge <= 8; edge *= 2) {
        result = [];
        let prev = points[points.length - 1];
        let prevInside = !(bitCode(prev, bbox) & edge);

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const inside = !(bitCode(p, bbox) & edge);

            // if segment goes through the clip window, add an intersection
            if (inside !== prevInside)
                result.push(intersect(prev, p, edge, bbox));

            if (inside) result.push(p); // add a point if it's inside

            prev = p;
            prevInside = inside;
        }

        points = result;

        if (!points.length) break;
    }

    return result!;
}

/**
 * intersect a segment against one of the 4 lines that make up the bbox
 */
function intersect(a: Point, b: Point, edge: BitCode, bbox: BBox): Point {
    return edge & 8
        ? {
              x: a.x + ((b.x - a.x) * (bbox.maxY - a.y)) / (b.y - a.y),
              y: bbox.maxY,
          } // top
        : edge & 4
          ? {
                x: a.x + ((b.x - a.x) * (bbox.minY - a.y)) / (b.y - a.y),
                y: bbox.minY,
            } // bottom
          : edge & 2
            ? {
                  x: bbox.maxX,
                  y: a.y + ((b.y - a.y) * (bbox.maxX - a.x)) / (b.x - a.x),
              } // right
            : edge & 1
              ? {
                    x: bbox.minX,
                    y: a.y + ((b.y - a.y) * (bbox.minX - a.x)) / (b.x - a.x),
                }
              : null!; // left
}

/**
 * bit code reflects the point position relative to the bbox:
 *
 *         left  mid  right
 *    top  1001  1000  1010
 *    mid  0001  0000  0010
 * bottom  0101  0100  0110
 */
function bitCode(p: Point, bbox: BBox): BitCode {
    let code = 0;

    if (p.x < bbox.minX)
        code |= 1; // left
    else if (p.x > bbox.maxX) code |= 2; // right

    if (p.y < bbox.minY)
        code |= 4; // bottom
    else if (p.y > bbox.maxY) code |= 8; // top

    return code;
}
