import { Shape } from "src/grid/Scorer.js";
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
            for (const triangle of shape.triangles) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', `${(triangle.left + triangle.center[0]) * SCALE}`);
                circle.setAttribute('cy', `${(triangle.top + triangle.center[1]) * SCALE}`);
                circle.setAttribute('r', '10');
                circle.setAttribute('fill', '#000000');
                group.appendChild(circle);
            }

            for (const edge of shape.edges) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', `${(edge.from.left + edge.from.center[0]) * SCALE}`);
                line.setAttribute('y1', `${(edge.from.top + edge.from.center[1]) * SCALE}`);
                line.setAttribute('x2', `${(edge.to.left + edge.to.center[0]) * SCALE}`);
                line.setAttribute('y2', `${(edge.to.top + edge.to.center[1]) * SCALE}`);
                line.setAttribute('stroke', Color.main);
                line.setAttribute('stroke-width', '8');
                group.appendChild(line);
            }
        }

        if (this.group) {
            this.element.removeChild(this.group);
        }
        this.element.appendChild(group);
        this.group = group;
    }
}
