// from node polylabel package

import { Point } from "../geom/math";
import { TinyQueue } from "./tinyqueue";

type Pole = { x: number; y: number; distance: number };
// TODO switch to Point { x, y }
type Polygon = Point[][];

export function polylabel(
    polygon: Polygon,
    precision?: number,
    debug?: boolean,
): Pole {
    precision = precision || 1.0;

    // find the bounding box of the outer ring
    let minX, minY, maxX, maxY;
    for (let i = 0; i < polygon[0].length; i++) {
        const p = polygon[0][i];
        if (!i || p.x < minX!) minX = p.x;
        if (!i || p.y < minY!) minY = p.y;
        if (!i || p.x > maxX!) maxX = p.x;
        if (!i || p.y > maxY!) maxY = p.y;
    }

    if (
        minX === undefined ||
        minY === undefined ||
        maxX === undefined ||
        maxY === undefined
    ) {
        throw new Error("no polygons found");
    }

    const width = maxX - minX!;
    const height = maxY - minY;
    const cellSize = Math.min(width, height);
    let h = cellSize / 2;

    if (cellSize === 0) {
        return { x: minX, y: minY, distance: 0 };
    }

    // a priority queue of cells in order of their "potential" (max distance to polygon)
    const cellQueue = new TinyQueue<Cell>([], compareMax);

    // cover polygon with initial cells
    for (let x = minX; x < maxX; x += cellSize) {
        for (let y = minY; y < maxY; y += cellSize) {
            cellQueue.push(new Cell(x + h, y + h, h, polygon));
        }
    }

    // take centroid as the first best guess
    let bestCell = getCentroidCell(polygon);

    // special case for rectangular polygons
    const bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, polygon);
    if (bboxCell.d > bestCell.d) bestCell = bboxCell;

    let numProbes = cellQueue.length;

    while (cellQueue.length) {
        // pick the most promising cell from the queue
        const cell = cellQueue.pop()!;

        // update the best cell if we found a better one
        if (cell.d > bestCell.d) {
            bestCell = cell;
            if (debug)
                console.log(
                    "found best %d after %d probes",
                    Math.round(1e4 * cell.d) / 1e4,
                    numProbes,
                );
        }

        // do not drill down further if there's no chance of a better solution
        if (cell.max - bestCell.d <= precision) continue;

        // split the cell into four cells
        h = cell.h / 2;
        cellQueue.push(new Cell(cell.x - h, cell.y - h, h, polygon));
        cellQueue.push(new Cell(cell.x + h, cell.y - h, h, polygon));
        cellQueue.push(new Cell(cell.x - h, cell.y + h, h, polygon));
        cellQueue.push(new Cell(cell.x + h, cell.y + h, h, polygon));
        numProbes += 4;
    }

    if (debug) {
        console.log("num probes: " + numProbes);
        console.log("best distance: " + bestCell.d);
    }

    return { x: bestCell.x, y: bestCell.y, distance: bestCell.d };
}

function compareMax(a: Cell, b: Cell): number {
    return b.max - a.max;
}

class Cell {
    x: number;
    y: number;
    h: number;
    d: number;
    max: number;

    constructor(x: number, y: number, h: number, polygon: Polygon) {
        this.x = x; // cell center x
        this.y = y; // cell center y
        this.h = h; // half the cell size
        this.d = pointToPolygonDist(x, y, polygon); // distance from cell center to polygon
        this.max = this.d + this.h * Math.SQRT2; // max distance to polygon within a cell
    }
}

// signed distance from point to polygon outline (negative if point is outside)
function pointToPolygonDist(x: number, y: number, polygon: Polygon): number {
    let inside = false;
    let minDistSq = Infinity;

    for (let k = 0; k < polygon.length; k++) {
        const ring = polygon[k];

        for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
            const a = ring[i];
            const b = ring[j];

            if (
                a.y > y !== b.y > y &&
                x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
            )
                inside = !inside;

            minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
        }
    }

    return minDistSq === 0 ? 0 : (inside ? 1 : -1) * Math.sqrt(minDistSq);
}

// get polygon centroid
function getCentroidCell(polygon: Polygon): Cell {
    let area = 0;
    let x = 0;
    let y = 0;
    const points = polygon[0];

    for (let i = 0, len = points.length, j = len - 1; i < len; j = i++) {
        const a = points[i];
        const b = points[j];
        const f = a.x * b.y - b.x * a.y;
        x += (a.x + b.x) * f;
        y += (a.y + b.y) * f;
        area += f * 3;
    }
    if (area === 0) return new Cell(points[0].x, points[0].y, 0, polygon);
    return new Cell(x / area, y / area, 0, polygon);
}

// get squared distance from a point to a segment
function getSegDistSq(px: number, py: number, a: Point, b: Point): number {
    let x = a.x;
    let y = a.y;
    let dx = b.x - x;
    let dy = b.y - y;

    if (dx !== 0 || dy !== 0) {
        const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = b.x;
            y = b.y;
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = px - x;
    dy = py - y;

    return dx * dx + dy * dy;
}
