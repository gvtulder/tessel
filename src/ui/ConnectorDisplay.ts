import { SCALE } from '../settings.js';
import { Triangle } from "../grid/Triangle.js";
import { Grid, GridEvent } from 'src/grid/Grid.js';


/**
 * Debugging helper to draw connecting lines between triangle centers.
 */
export class ConnectorDisplay {
    grid : Grid;
    svgGroup: SVGElement;

    constructor(grid : Grid) {
        this.grid = grid;

        this.build();
        for (const triangle of grid.triangles.values()) {
            this.addTriangle(triangle);
        }

        grid.addEventListener(Grid.events.AddTriangle,
            (evt : GridEvent) => this.addTriangle(evt.triangle)
        );
    }

    build() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-ConnectorDisplay');
        this.svgGroup = group;
    }

    addTriangle(triangle: Triangle) {
        for (const neighbor of triangle.getNeighbors()) {
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
