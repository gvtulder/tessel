import { Shape } from "src/grid/Scorer.js";
import { SCALE } from "src/settings.js";
import { ScoreOverlayDisplay, Color } from "./ScoreOverlayDisplay.js";
import { Triangle } from "src/grid/Triangle.js";

export class ScoreOverlayDisplay_Circles extends ScoreOverlayDisplay {
    group : SVGElement;

    build: () => void;

    showScores(shapes : Shape[]) {
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
