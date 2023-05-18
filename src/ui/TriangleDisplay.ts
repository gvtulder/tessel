import { GridDisplay, NewGrid, SCALE, OFFSET, DEBUG } from '../newgrid.js';
import { Triangle } from "src/Triangle.js";

export class TriangleDisplay {
    gridDisplay: GridDisplay;
    grid: NewGrid;
    triangle: Triangle;

    element: HTMLDivElement;
    triangleElement: SVGElement;

    constructor(gridDisplay: GridDisplay, grid: NewGrid, triangle: Triangle) {
        this.gridDisplay = gridDisplay;
        this.grid = grid;
        this.triangle = triangle;

        this.build();

        this.triangle.addEventListener('changecolor', () => { this.updateColor(); });
    }

    build() {
        const div = document.createElement('div');
        div.title = `(${this.triangle.x},${this.triangle.y})`;
        this.element = div;

        div.style.position = 'absolute';
        div.style.left = `${this.triangle.left * SCALE + OFFSET}px`;
        div.style.top = `${this.triangle.top * SCALE + OFFSET}px`;
        div.style.zIndex = `${this.triangle.x * 1000 + this.triangle.y}`;

        const svg = this.generateSvg();
        div.appendChild(svg);
    }

    generateSvg() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', `${SCALE + 10}`);
        svg.setAttribute('height', `${SCALE + 10}`);

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svg.appendChild(group);

        const pointsString = [...this.triangle.points, this.triangle.points[0]].map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);
        const polyString = this.triangle.polyPoints.map((p) => `${p[0] * SCALE},${p[1] * SCALE}`);

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        el.setAttribute('points', polyString.join(' '));
        if (DEBUG.OVERLAP) {
            el.setAttribute('opacity', `${DEBUG.OPACITY}`);
        }
        // el.setAttribute('fill', 'transparent');
        // el.setAttribute('stroke', 'white');
        // el.setAttribute('stroke-width', '2px');
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

        return svg;
    }

    updateColor() {
        const color = this.triangle.color || 'transparent';
        this.triangleElement.setAttribute('fill', color);
    }
}
