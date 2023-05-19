import { Shape } from "src/grid/Scorer.js";
import { Triangle } from "src/grid/Triangle.js";
import { SCALE } from "src/settings.js";

const Color = {
    main: '#9acd32',
    light: '#e1f0c1',
    dark: '#63851d'
};

export class ScoreOverlayDisplay {
    element : SVGElement;
    group : SVGElement;

    constructor() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'svg-scoreOverlay');
    }

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

            for (const triangle of edgesPerTriangle.keys()) {
                const edges = edgesPerTriangle.get(triangle);
                if (edges.length == 2) {
                    // 2 edges
                    const tO = edges[0].from;
                    const tA = edges[0].to;
                    const tB = edges[1].to;

                    const cA = [(tA.left + tA.center[0]) * SCALE, (tA.top + tA.center[1]) * SCALE];
                    const cB = [(tB.left + tB.center[0]) * SCALE, (tB.top + tB.center[1]) * SCALE];
                    const cO = [(tO.left + tO.center[0]) * SCALE, (tO.top + tO.center[1]) * SCALE];

                    const f = 0.5;

                    const midAO = [(f * cA[0] + (1 - f) * cO[0]), (f * cA[1] + (1 - f) * cO[1])];
                    const midBO = [(f * cB[0] + (1 - f) * cO[0]), (f * cB[1] + (1 - f) * cO[1])];

                    // straight
                    let pathString = `M ${midAO[0]},${midAO[1]} ${cO[0]},${cO[1]} ${midBO[0]},${midBO[1]}`;

                    // quadratic curve
                    pathString = `M ${midAO[0]},${midAO[1]} Q ${cO[0]},${cO[1]} ${midBO[0]},${midBO[1]}`;

                    // non-quadratic curves
                    pathString = `M ${midAO[0]},${midAO[1]} C ${cO[0]},${cO[1]} ${cO[0]},${cO[1]} ${midBO[0]},${midBO[1]}`;

                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', pathString);
                    path.setAttribute('fill', 'transparent');
                    path.setAttribute('stroke', Color.main);
                    path.setAttribute('stroke-width', '8');
                    path.setAttribute('stroke-linecap', 'round');
                    group.appendChild(path);
                } else if (edges.length == 3) {
                    // 3 edges
                    const tO = edges[0].from;
                    const tA = edges[0].to;
                    const tB = edges[1].to;
                    const tC = edges[2].to;

                    const cA = [(tA.left + tA.center[0]) * SCALE, (tA.top + tA.center[1]) * SCALE];
                    const cB = [(tB.left + tB.center[0]) * SCALE, (tB.top + tB.center[1]) * SCALE];
                    const cC = [(tC.left + tC.center[0]) * SCALE, (tC.top + tC.center[1]) * SCALE];
                    const cO = [(tO.left + tO.center[0]) * SCALE, (tO.top + tO.center[1]) * SCALE];

                    const f = 0.5;

                    const midAO = [(f * cA[0] + (1 - f) * cO[0]), (f * cA[1] + (1 - f) * cO[1])];
                    const midBO = [(f * cB[0] + (1 - f) * cO[0]), (f * cB[1] + (1 - f) * cO[1])];
                    const midCO = [(f * cC[0] + (1 - f) * cO[0]), (f * cC[1] + (1 - f) * cO[1])];

                    // straight
                    let pathString = `M ${midAO[0]},${midAO[1]} ${cO[0]},${cO[1]} ${midBO[0]},${midBO[1]}`;

                    // quadratic curves
                    let pathStrings = [
                        `M ${midAO[0]},${midAO[1]} Q ${cO[0]},${cO[1]} ${midBO[0]},${midBO[1]}`,
                        `M ${midAO[0]},${midAO[1]} Q ${cO[0]},${cO[1]} ${midCO[0]},${midCO[1]}`,
                        `M ${midBO[0]},${midBO[1]} Q ${cO[0]},${cO[1]} ${midCO[0]},${midCO[1]}`,
                    ];

                    // non-quadratic curves
                    pathStrings = [
                        `M ${midAO[0]},${midAO[1]} C ${cO[0]},${cO[1]} ${cO[0]},${cO[1]} ${midBO[0]},${midBO[1]}`,
                        `M ${midAO[0]},${midAO[1]} C ${cO[0]},${cO[1]} ${cO[0]},${cO[1]} ${midCO[0]},${midCO[1]}`,
                        `M ${midBO[0]},${midBO[1]} C ${cO[0]},${cO[1]} ${cO[0]},${cO[1]} ${midCO[0]},${midCO[1]}`,
                    ];

                    // quadratic curves
                    for (const pathString of pathStrings) {
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', pathString);
                        path.setAttribute('fill', 'transparent');
                        path.setAttribute('stroke', Color.main);
                        path.setAttribute('stroke-width', '8');
                        path.setAttribute('stroke-linecap', 'round');
                        group.appendChild(path);
                    }
                }
                console.log(edgesPerTriangle.get(triangle));
            }
        }

        if (this.group) {
            this.element.removeChild(this.group);
        }
        this.element.appendChild(group);
        this.group = group;
    }
}
