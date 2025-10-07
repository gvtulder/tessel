// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

import { TileSegment } from "../grid/Tile";

export type Vertex = { id: string; x: number; y: number };
export type Edge = {
    id: string;
    from: Vertex;
    to: Vertex;
    segment: TileSegment;
};

export function computeOutline(triangles: Set<TileSegment>): {
    boundary: Vertex[];
    edgesPerVertex: Map<string, Edge[]>;
} {
    const edges = new Map<string, Edge[]>();
    const edgesPerVertex = new Map<string, Edge[]>();
    let leftMostVertex: Vertex;

    for (const triangle of triangles.values()) {
        // rounding down to make the CoordIds unique
        const verts: Vertex[] = triangle.polygon.vertices
            .map((p) => ({
                id: `${Math.round(p.x * 100)},${Math.round(p.y * 100)}`,
                x: p.x,
                y: p.y,
            }))
            .sort((a, b) => (a.x == b.x ? a.y - b.y : a.x - b.x));

        // consider each edge of the triangle
        for (const ab of [
            [0, 1],
            [0, 2],
            [1, 2],
        ]) {
            let from = verts[ab[0]];
            let to = verts[ab[1]];
            if (to.id < from.id) {
                // keep in a consistent order
                from = verts[ab[1]];
                to = verts[ab[0]];
            }
            const edge: Edge = {
                id: `${from.id} ${to.id}`,
                from: from,
                to: to,
                segment: triangle,
            };
            if (!edges.has(edge.id)) {
                edges.set(edge.id, []);
            }
            edges.get(edge.id)!.push(edge);

            // add the vertices
            [edge.from, edge.to].forEach((v) => {
                if (!edgesPerVertex.has(v.id)) {
                    edgesPerVertex.set(v.id, []);
                }
                edgesPerVertex.get(v.id)!.push(edge);
                if (!leftMostVertex || leftMostVertex.x > v.x) {
                    leftMostVertex = v;
                }
            });
        }
    }

    // follow along edges
    let boundary: Vertex[] = [];
    let prev: Vertex = null!;
    let cur: Vertex = leftMostVertex!;
    let winding = 0;
    let i = 0;
    while (i < 1000 && (prev == null || cur.id != leftMostVertex!.id)) {
        i++;
        const uniqueEdges = edgesPerVertex!
            .get(cur.id)!
            .filter(
                (e) =>
                    (prev == null ||
                        (e.from.id != prev.id && e.to.id != prev.id)) &&
                    edges.get(e.id)!.length == 1,
            );

        // should have two unique edges
        const nextEdge = uniqueEdges[0];
        // console.log(i, nextEdge);
        const nextVertex =
            nextEdge.to.id == cur.id ? nextEdge.from : nextEdge.to;
        if (nextEdge.to.id == cur.id) {
            winding +=
                (nextEdge.from.x - nextEdge.to.x) *
                (nextEdge.from.y + nextEdge.to.y);
        } else {
            winding +=
                (nextEdge.to.x - nextEdge.from.x) *
                (nextEdge.from.y + nextEdge.to.y);
        }
        boundary.push(cur);
        prev = cur;
        cur = nextVertex;
    }

    if (winding > 0) {
        // counter-clockwise, make clockwise
        boundary = boundary.reverse();
    }

    // console.log(boundary);
    return { boundary: boundary, edgesPerVertex: edgesPerVertex };
}
