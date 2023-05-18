import { SCALE } from '../newgrid.js';
import { Triangle } from "src/Triangle.js";



export class ConnectorDisplay {
    element: HTMLDivElement;
    svgGroup: SVGElement;

    constructor() {
        this.build();
    }

    build() {
        const div = document.createElement('div');
        this.element = div;

        const svg = this.generateSvg();
        this.element.appendChild(svg);
    }

    generateSvg() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', `${100 * SCALE}`);
        svg.setAttribute('height', `${100 * SCALE}`);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(group);
        this.svgGroup = group;

        return svg;
    }

    connect(triangle: Triangle, neighbors: Triangle[]) {
        for (const neighbor of neighbors) {
            this.drawLine(triangle, neighbor);
        }
    }

    drawLine(a: Triangle, b: Triangle) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${(a.left + a.center[0]) * SCALE}`);
        line.setAttribute('y1', `${(a.top + a.center[1]) * SCALE}`);
        line.setAttribute('x2', `${(b.left + b.center[0]) * SCALE}`);
        line.setAttribute('y2', `${(b.top + b.center[1]) * SCALE}`);
        line.setAttribute('opacity', '0.5');
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-width', '2');
        this.svgGroup.appendChild(line);
    }
}
