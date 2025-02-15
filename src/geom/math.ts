
export type Point = {
    x: number,
    y: number,
};
export type Edge = {
    a: Point,
    b: Point
};
export type BBox = {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
};

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/**
 * Computes the distance between two points.
 */
export function dist(a: Point, b: Point): number {
    // return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Compares two points.
 * First compares a.x and b.x, then a.y and b.y.
 * @returns -1 if a is less than b, 1 if a is greater than b, 0 if a == b
 */
export function comparePoint(a: Point, b: Point): number {
    return (a.x < b.x) ? -1 : ((a.x > b.x) ? 1 : Math.sign(a.y - b.y));
}

/**
 * Computes the angle of an edge wrt the x axis.
 * @returns the angle in radians
 */
export function edgeToAngle(edge: Edge): number {
    return Math.atan2(edge.b.y - edge.a.y, edge.b.x - edge.a.x);
}

/**
 * Computes the midpoint of an edge.
 * @param edge an edge from a to b
 * @returns the point between a and b
 */
export function midpoint(edge: Edge): Point {
    return {
        x: (edge.a.x + edge.b.x) / 2,
        y: (edge.a.y + edge.b.y) / 2
    };
}

/**
 * Computes the centroid of the given points.
 * @param points a collection of points
 * @returns the centroid
 */
export function centroid(points: Point[]): Point {
    let x = 0;
    let y = 0;
    for (const point of points) {
        x += point.x;
        y += point.y;
    }
    return {
        x: x / points.length,
        y: y / points.length,
    };
}

/**
 * Computes the bounding box for the given points.
 * @param points a collection of points
 * @returns the bounding box
 */
export function bbox(points: Point[]): BBox {
    const n = points.length;
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;
    for (let i = 1; i < n; i++) {
        const p = points[i];
        minX = minX > p.x ? p.x : minX;
        minY = minY > p.y ? p.y : minY;
        maxX = maxX < p.x ? p.x : maxX;
        maxY = maxY < p.y ? p.y : maxY;
    }
    return {
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
    };
}
