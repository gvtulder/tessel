import { SCALE, DEBUG, PLACEHOLDER } from '../settings.js';
import { Triangle } from "../grid/Triangle.js";

export class TriangleDisplay {
    triangle: Triangle;

    element: SVGElement;
    triangleElement : SVGElement;

    constructor(triangle: Triangle) {
        this.triangle = triangle;

        this.build();

        this.triangle.addEventListener('changecolor', () => { this.updateColor(); });
    }

    build() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-triangle');
        this.element = group;

        const pointsString = [...this.triangle.points, this.triangle.points[0]].map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);
        const polyString = this.triangle.polyPoints.map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        el.setAttribute('data-x', `${this.triangle.x}`);
        el.setAttribute('data-y', `${this.triangle.y}`);
        el.setAttribute('points', polyString.join(' '));
        if (DEBUG.OVERLAP) {
            el.setAttribute('opacity', `${DEBUG.OPACITY}`);
        }
        group.append(el);
        this.triangleElement = el;
        this.updateColor();

        if (DEBUG.TRIANGLE_OUTLINE) {
            const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            outline.setAttribute('points', pointsString.join(' '));
            outline.setAttribute('fill', 'transparent');
            outline.setAttribute('stroke', 'yellow');
            outline.setAttribute('stroke-width', '1px');
            group.append(outline);
        }

        if (DEBUG.NUMBER_TRIANGLES) {
            const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            center.setAttribute('cx', `${this.triangle.center[0] * SCALE}`);
            center.setAttribute('cy', `${this.triangle.center[1] * SCALE}`);
            center.setAttribute('r', `${0.02 * SCALE}`);
            center.setAttribute('opacity', '0.5');
            center.setAttribute('fill', 'black');
            group.append(center);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', `${this.triangle.center[0] * SCALE}`);
            text.setAttribute('y', `${this.triangle.center[1] * SCALE}`);
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '11');
            text.setAttribute('fill', 'white');
            text.appendChild(document.createTextNode(`(${this.triangle.x},${this.triangle.y})`));
            group.append(text);
        }
    }

    updateColor() {
        const color = this.triangle.color || PLACEHOLDER;
        this.triangleElement.setAttribute('fill', color);
    }
}
