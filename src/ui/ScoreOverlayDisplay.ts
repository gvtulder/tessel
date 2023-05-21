import { Shape } from "src/grid/Scorer.js";
import { Triangle } from "src/grid/Triangle.js";
import { BGCOLOR, SCALE } from "src/settings.js";
import { roundPathCorners } from '../lib/svg-rounded-corners.js';

const Color = {
    main: '#9acd32',
    light: '#e1f0c1',
    dark: '#63851d'
};

type Vertex = { id: string, x: number, y: number };

export class ScoreOverlayDisplay {
    element : SVGElement;
    group : SVGElement;
    maskOverlay : SVGElement;
    mask : SVGElement;
    maskPathGroup : SVGElement;

    constructor() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'svg-scoreOverlay');


        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-scoreOverlay-mask disabled')

        const overlayFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        overlayFill.setAttribute('class', 'svg-scoreOverlay-fill');
        overlayFill.setAttribute('x', '-1000');
        overlayFill.setAttribute('y', '-1000');
        overlayFill.setAttribute('width', '10000');
        overlayFill.setAttribute('height', '10000');
        overlayFill.setAttribute('fill', BGCOLOR);
        overlayFill.setAttribute('mask', 'url(#scoreoverlaymask)');
        group.appendChild(overlayFill);

        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', 'scoreoverlaymask');
        group.appendChild(mask);

        const maskWhite = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        maskWhite.setAttribute('class', 'svg-scoreOverlay-fill');
        maskWhite.setAttribute('x', '-1000');
        maskWhite.setAttribute('y', '-1000');
        maskWhite.setAttribute('width', '10000');
        maskWhite.setAttribute('height', '10000');
        maskWhite.setAttribute('fill', 'white');
        mask.appendChild(maskWhite);

        this.maskOverlay = group;
        this.mask = mask;
    }

    showScores(shapes : Shape[]) {
        this.showScores_outline(shapes);
        // this.showScores_circles(shapes);
    }

    showScores_outline(shapes : Shape[]) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const maskPathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        for (const shape of shapes) {
            const boundary : Vertex[] = this.computeOutline(shape);

            const pathString = 'M ' + (boundary.reverse().map((v) => `${v.x * SCALE},${v.y * SCALE}`)).join(' ') + ' Z';
            console.log(pathString);

            // outline
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathString);
            path.setAttribute('fill', 'transparent');
            path.setAttribute('stroke', Color.main);
            path.setAttribute('stroke-width', '20');
            path.setAttribute('stroke-linecap', 'round');
            group.appendChild(path);

            // add mask
            const maskPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            maskPath.setAttribute('d', pathString);
            maskPath.setAttribute('fill', 'black');
            maskPathGroup.appendChild(maskPath);

            // animate path
            const pathComponents = (boundary.reverse().map((v) => `${v.x * SCALE},${v.y * SCALE}`));
            const curPath = [pathComponents.pop()];
            path.setAttribute('d', '');
            const interval = window.setInterval(() => {
                let finished = false;
                if (pathComponents.length == 0) {
                    window.clearInterval(interval);
                    finished = true;
                } else {
                    curPath.push(pathComponents.pop());
                }
                const roundPath = roundPathCorners('M ' + curPath.join(' L ') + (finished ? ' Z' : ''), 10, false);
                console.log(roundPath);
                path.setAttribute('d', roundPath);
            }, 50);
        }

        if (this.maskPathGroup) {
            this.mask.removeChild(this.maskPathGroup);
        }
        this.mask.appendChild(maskPathGroup);
        this.maskPathGroup = maskPathGroup;
        this.mask.classList.remove('disabled');
        this.mask.classList.add('enabled');
        this.mask.addEventListener('animationend', () => {
            this.mask.classList.replace('enabled', 'disabled');
        });

        if (this.group) {
            this.element.removeChild(this.group);
        }
        this.element.appendChild(group);
        this.group = group;
    }

    private computeOutline(shape : Shape) : Vertex[] {
        type Edge = { id: string, from: Vertex, to: Vertex, triangle : Triangle };
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

                [edge.from, edge.to].forEach((e) => {
                    if (!edgesPerVertex.has(e.id)) {
                        edgesPerVertex.set(e.id, []);
                    }
                    edgesPerVertex.get(e.id).push(edge);
                    if (!leftMostVertex || leftMostVertex.x > e.x) {
                        leftMostVertex = e;
                    }
                });
            }
        }

        // follow along edges
        const boundary : Vertex[] = [];
        let prev : Vertex = null;
        let cur : Vertex = leftMostVertex;
        let i = 0;
        while (i < 100 && (prev == null || cur.id != leftMostVertex.id)) {
            i++;
            const uniqueEdges = edgesPerVertex.get(cur.id).filter((e) => (
                (prev == null || (e.from.id != prev.id && e.to.id != prev.id)) && edges.get(e.id).length == 1
            ));

            // should have two unique edges
            // console.log(uniqueEdges);
            const nextEdge = uniqueEdges[0];
            console.log(i, nextEdge);
            const nextVertex = (nextEdge.to.id == cur.id) ? nextEdge.from : nextEdge.to;
            boundary.push(cur);
            prev = cur;
            cur = nextVertex;
        }

        console.log(boundary);
        return boundary;
    }

    showScores_circles(shapes : Shape[]) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        for (const shape of shapes) {
            /*
            for (const triangle of shape.triangles) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', `${(triangle.left + triangle.center[0]) * SCALE}`);
                circle.setAttribute('cy', `${(triangle.top + triangle.center[1]) * SCALE}`);
                circle.setAttribute('r', '10');
                circle.setAttribute('fill', '#00ff00');
                group.appendChild(circle);
            }
            */

            /*
            for (const edge of shape.edges) {
                const from = [ edge.from.left + edge.from.center[0],
                            edge.from.top + edge.from.center[1] ];
                const to = [ edge.to.left + edge.to.center[0],
                            edge.to.top + edge.to.center[1] ];
                let mid = [ (from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
                let f = 0.6;
                mid = [ (f * from[0] + (1 - f) * to[0]), (f * from[1] + (1 - f) * to[1]) ];

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', `${(from[0]) * SCALE}`);
                line.setAttribute('y1', `${(from[1]) * SCALE}`);
                line.setAttribute('x2', `${(mid[0]) * SCALE}`);
                line.setAttribute('y2', `${(mid[1]) * SCALE}`);
                line.setAttribute('stroke', Color.main);
                line.setAttribute('stroke-width', '8');
                // group.appendChild(line);
            }
            */


            const edgesPerTriangle = new Map<Triangle, Shape['edges']>();
            for (const edge of shape.edges) {
                if (!edgesPerTriangle.has(edge.from)) edgesPerTriangle.set(edge.from, []);
                edgesPerTriangle.get(edge.from).push(edge);
            }

            const pathStrings : string[] = [];
            const circles : [number, number][] = [];

            for (const triangle of edgesPerTriangle.keys()) {
                const edges = edgesPerTriangle.get(triangle);

                const f = 0.5;
                const fc = 0.0;

                const tO = edges[0].from;
                const cO : [number, number] = [(tO.left + tO.center[0]) * SCALE, (tO.top + tO.center[1]) * SCALE];

                if (edges.length == 1) {
                    const tA = edges[0].to;
                    const cA = [(tA.left + tA.center[0]) * SCALE, (tA.top + tA.center[1]) * SCALE];

                    const midAO : [number, number] = [(f * cA[0] + (1 - f) * cO[0]), (f * cA[1] + (1 - f) * cO[1])];

                    // non-quadratic curves
                    pathStrings.push(
                    //    `M ${midAO[0]},${midAO[1]} C ${cO[0]},${cO[1]} ${cO[0]},${cO[1]} ${cO[0]},${cO[1]}`
                    );

                    // circles.push(cO)
                    circles.push(midAO)

                } else {
                    for (const edgeA of edges) {
                        for (const edgeB of edges) {
                            // if (edgeA.to !== edgeB.to) {
                            // deduplicate: only draw each edge once
                            // if (edgeA.to.x < edgeB.to.x || (edgeB.to.x == edgeB.to.x && edgeB.to.y < edgeB.to.y)) {
                            if (edgeA.to !== edgeB.to) {
                                const tA = edgeA.to;
                                const tB = edgeB.to;

                                const cA = [(tA.left + tA.center[0]) * SCALE, (tA.top + tA.center[1]) * SCALE];
                                const cB = [(tB.left + tB.center[0]) * SCALE, (tB.top + tB.center[1]) * SCALE];

                                const midAO = [(f * cA[0] + (1 - f) * cO[0]), (f * cA[1] + (1 - f) * cO[1])];
                                const midBO = [(f * cB[0] + (1 - f) * cO[0]), (f * cB[1] + (1 - f) * cO[1])];

                                const cpAO = [(fc * midAO[0] + (1 - fc) * cO[0]), (fc * midAO[1] + (1 - fc) * cO[1])];
                                const cpBO = [(fc * midBO[0] + (1 - fc) * cO[0]), (fc * midBO[1] + (1 - fc) * cO[1])];

                                // non-quadratic curves
                                pathStrings.push(
                                //  `M ${midAO[0]},${midAO[1]} C ${cO[0]},${cO[1]} ${cO[0]},${cO[1]} ${midBO[0]},${midBO[1]}`
                                    `M ${midAO[0]},${midAO[1]} C ${cpAO[0]},${cpAO[1]} ${cpBO[0]},${cpBO[1]} ${midBO[0]},${midBO[1]}`
                                );

                                if (edgeA.to.tile !== edgeA.from.tile) {
                                    circles.push(midAO as [number, number]);
                                }
                                if (edgeB.to.tile !== edgeB.from.tile) {
                                    circles.push(midBO as [number, number]);
                                }
                                // circles.push(cO);
                            }
                        }
                    }
                }

                console.log(edgesPerTriangle.get(triangle));
            }

            for (const pathString of pathStrings) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathString);
                path.setAttribute('fill', 'transparent');
                path.setAttribute('stroke', Color.main);
                path.setAttribute('stroke-width', '8');
                path.setAttribute('stroke-linecap', 'round');
                group.appendChild(path);
            }

            for (const circle of circles) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                path.setAttribute('cx', `${circle[0]}`);
                path.setAttribute('cy', `${circle[1]}`);
                path.setAttribute('r', '11');
                path.setAttribute('r', '10');
                path.setAttribute('r', '7');
                path.setAttribute('r', '11');
                path.setAttribute('fill', Color.light);
                path.setAttribute('stroke', Color.dark);
                path.setAttribute('stroke-width', '8');
                path.setAttribute('stroke-width', '5');
                path.setAttribute('stroke-width', '8');
                path.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
                group.appendChild(path);
            }

            const scorePos = circles[0];

            /*
            const dist = (a : number[], b : number[]) => {
                return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
            };
            */

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', `${scorePos[0]}`);
            circle.setAttribute('cy', `${scorePos[1]}`);
            circle.setAttribute('r', '20');
            circle.setAttribute('fill', Color.light);
            circle.setAttribute('stroke', Color.dark);
            circle.setAttribute('stroke-width', '8');
            circle.setAttribute('style', 'filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));');
            group.appendChild(circle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', `${scorePos[0]}`);
            text.setAttribute('y', `${scorePos[1] + 1}`);
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '21');
            text.appendChild(document.createTextNode(`${shape.points}`));
            group.appendChild(text);
        }

        if (this.group) {
            this.element.removeChild(this.group);
        }
        this.element.appendChild(group);
        this.group = group;
    }
}
