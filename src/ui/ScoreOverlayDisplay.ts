import { Shape } from "src/grid/Scorer.js";
import { Triangle } from "src/grid/Triangle.js";

export const Color = {
    main: '#9acd32',
    light: '#e1f0c1',
    dark: '#63851d'
};

export type Vertex = { id: string, x: number, y: number };
export type Edge = { id: string, from: Vertex, to: Vertex, triangle : Triangle };

export abstract class ScoreOverlayDisplay {
    element : SVGElement;

    constructor() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'svg-scoreOverlay');

        this.build();
    }

    abstract build();
    abstract showScores(shapes : Shape[]);

    hide() {
        return;
    }

    protected computeOutline(shape : Shape) : { boundary: Vertex[], edgesPerVertex: Map<string, Edge[]> } {
        const edges = new Map<string, Edge[]>();
        const edgesPerVertex = new Map<string, Edge[]>();
        let leftMostVertex : Vertex;

        for (const triangle of shape.triangles.values()) {
            // rounding
            const verts : Vertex[] = triangle.points.map((p) => {
                p = [p[0] + triangle.left, p[1] + triangle.top];
                return {
                    id: `${Math.floor(p[0] * 100)},${Math.floor(p[1] * 100)}`,
                    x: p[0], y: p[1]
                };
            }).sort((a, b) => (a.x == b.x) ? (a.y - b.y) : (a.x - b.x));

            for (const ab of [[0, 1], [0, 2], [1, 2]]) {
                const edge : Edge = {
                    id: `${verts[ab[0]].id} ${verts[ab[1]].id}`,
                    from: verts[ab[0]],
                    to: verts[ab[1]],
                    triangle: triangle,
                };
                if (!edges.has(edge.id)) {
                    edges.set(edge.id, []);
                }
                edges.get(edge.id).push(edge);

                [edge.from, edge.to].forEach((v) => {
                    if (!edgesPerVertex.has(v.id)) {
                        edgesPerVertex.set(v.id, []);
                    }
                    edgesPerVertex.get(v.id).push(edge);
                    if (!leftMostVertex || leftMostVertex.x > v.x) {
                        leftMostVertex = v;
                    }
                });
            }
        }

        // follow along edges
        const boundary : Vertex[] = [];
        let prev : Vertex = null;
        let cur : Vertex = leftMostVertex;
        let i = 0;
        while (i < 1000 && (prev == null || cur.id != leftMostVertex.id)) {
            i++;
            const uniqueEdges = edgesPerVertex.get(cur.id).filter((e) => (
                (prev == null || (e.from.id != prev.id && e.to.id != prev.id)) && edges.get(e.id).length == 1
            ));

            // should have two unique edges
            const nextEdge = uniqueEdges[0];
            // console.log(i, nextEdge);
            const nextVertex = (nextEdge.to.id == cur.id) ? nextEdge.from : nextEdge.to;
            boundary.push(cur);
            prev = cur;
            cur = nextVertex;
        }

        console.log(boundary);
        return { boundary: boundary, edgesPerVertex: edgesPerVertex };
    }
}
