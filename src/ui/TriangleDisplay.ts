import { SCALE, DEBUG, PLACEHOLDER } from '../settings.js';
import { Triangle } from "../grid/Triangle.js";

/**
 * Display a triangle on the SVG grid.
 */
export class TriangleDisplay {
    triangle: Triangle;

    element: SVGElement;
    triangleElement : SVGElement;
    centerElement : SVGElement;

    constructor(triangle: Triangle) {
        this.triangle = triangle;

        this.build();
    }

    build() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-triangle');
        this.element = group;

        const centerEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        centerEl.setAttribute('cx', `${this.triangle.center[0] * SCALE}`);
        centerEl.setAttribute('cy', `${this.triangle.center[1] * SCALE}`);
        centerEl.setAttribute('r', '1');
        centerEl.setAttribute('fill', 'transparent');
        group.appendChild(centerEl);
        this.centerElement = centerEl;

        const pointsString = [...this.triangle.points, this.triangle.points[0]].map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);
        const polyString = this.triangle.polyPoints.map((p) => `${(p[0] * SCALE).toFixed(5)},${(p[1] * SCALE).toFixed(5)}`);

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
            outline.setAttribute('data-x', `${this.triangle.x}`);
            outline.setAttribute('data-y', `${this.triangle.y}`);
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
            text.setAttribute('fill', '#aaa');
            text.appendChild(document.createTextNode(`(${this.triangle.x},${this.triangle.y})`));
            group.append(text);
        }
    }

    destroy() {
        this.element.remove();
        this.triangleElement.remove();
        this.centerElement.remove();
    }

    updateColor() {
        const color = this.triangle.color || PLACEHOLDER;
        this.triangleElement.setAttribute('fill', color);
    }

    getBoundingClientRect() : DOMRect {
        return this.centerElement.getBoundingClientRect();
    }

    getClientCenterCoord() : [number, number] {
        const rect = this.centerElement.getBoundingClientRect();
        return [rect.left + 0.5 * rect.width, rect.top + 0.5 * rect.height];
    }
}
