import { SCALE } from "../settings.js";
import { Triangle } from "../grid/Triangle.js";
import { Grid, GridEvent } from "../grid/Grid.js";
import { midPoint } from "../utils.js";

/**
 * Debugging helper to draw connecting lines between triangle centers.
 */
export class ConnectorDisplay {
    grid: Grid;
    svgGroup: SVGElement;

    private addTriangleEventListener: EventListener;

    constructor(grid: Grid) {
        this.grid = grid;

        this.build();
        for (const triangle of grid.triangles.values()) {
            this.addTriangle(triangle);
        }

        this.addTriangleEventListener = (evt: GridEvent) =>
            this.addTriangle(evt.triangle);

        grid.addEventListener(
            Grid.events.AddTriangle,
            this.addTriangleEventListener,
        );
    }

    build() {
        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        group.setAttribute("class", "svg-ConnectorDisplay");
        this.svgGroup = group;
    }

    destroy() {
        this.grid.removeEventListener(
            Grid.events.AddTriangle,
            this.addTriangleEventListener,
        );
        this.addTriangleEventListener = null;
        this.svgGroup.remove();
    }

    addTriangle(triangle: Triangle) {
        for (const neighbor of triangle.getNeighbors()) {
            this.drawLine(triangle, neighbor);
            for (const n of neighbor.getNeighbors()) {
                this.drawLine(neighbor, n);
            }
        }
        const edge = triangle.getRotationEdge(0);
        if (edge && edge.to && edge.from) {
            this.drawRotationEdge(edge.from, edge.to);
        }
        for (const neighbor of triangle.getNeighbors()) {
            const edge = neighbor.getRotationEdge(0);
            if (edge && edge.to && edge.from) {
                this.drawRotationEdge(edge.from, edge.to);
            }
        }
    }

    drawLine(a: Triangle, b: Triangle) {
        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line",
        );
        const mid = midPoint(
            [a.left + a.center[0], a.top + a.center[1]],
            [b.left + b.center[0], b.top + b.center[1]],
        );
        line.setAttribute("x1", `${(a.left + a.center[0]) * SCALE}`);
        line.setAttribute("y1", `${(a.top + a.center[1]) * SCALE}`);
        line.setAttribute("x2", `${mid[0] * SCALE}`);
        line.setAttribute("y2", `${mid[1] * SCALE}`);
        line.setAttribute("opacity", "0.5");
        line.setAttribute("stroke", "red");
        line.setAttribute("stroke-width", "2");
        this.svgGroup.appendChild(line);
    }

    drawRotationEdge(a: Triangle, b: Triangle) {
        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line",
        );
        line.setAttribute("x1", `${(a.left + a.center[0]) * SCALE + 5}`);
        line.setAttribute("y1", `${(a.top + a.center[1]) * SCALE + 5}`);
        line.setAttribute("x2", `${(b.left + b.center[0]) * SCALE + 5}`);
        line.setAttribute("y2", `${(b.top + b.center[1]) * SCALE + 5}`);
        line.setAttribute("opacity", "0.5");
        line.setAttribute("stroke", "green");
        line.setAttribute("stroke-width", "2");
        this.svgGroup.appendChild(line);
    }
}
