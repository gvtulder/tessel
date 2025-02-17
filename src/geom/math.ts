export type Point = {
    readonly x: number;
    readonly y: number;
};
export type Edge = {
    readonly a: Point;
    readonly b: Point;
};
export type BBox = {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
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
    return a.x < b.x ? -1 : a.x > b.x ? 1 : Math.sign(a.y - b.y);
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
        y: (edge.a.y + edge.b.y) / 2,
    };
}

/**
 * Computes the centroid of a polygon.
 * @param points the vertices in clockwise order
 * @returns the centroid
 */
export function centroid(points: readonly Point[]): Point {
    if (points.length == 3) {
        return {
            x: (points[0].x + points[1].x + points[2].x) / 3,
            y: (points[0].y + points[1].y + points[2].y) / 3,
        };
    }

    // signed area using the shoelace formula
    let a = 0;
    let x = 0;
    let y = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const ai = p1.x * p2.y - p2.x * p1.y;
        a += ai;
        x += (p1.x + p2.x) * ai;
        y += (p1.y + p2.y) * ai;
    }
    x /= 3 * a;
    y /= 3 * a;
    return { x, y };
}

/**
 * Computes the area of a polygon.
 * @param points the vertices in order
 * @returns the area of the polygon
 */
export function area(points: readonly Point[]): number {
    return Math.abs(orientedArea(points));
}

/**
 * Computes the oriented area of a polygon.
 * For counter-clockwise polygons this is negative.
 * @param points the vertices in order
 * @returns the oriented area
 */
export function orientedArea(points: readonly Point[]): number {
    // using the triangle formula
    let a = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        a += p1.x * p2.y - p2.x * p1.y;
    }
    return a / 2;
}

/**
 * Computes the bounding box for the given points.
 * @param points a collection of points
 * @returns the bounding box
 */
export function bbox(points: readonly Point[]): BBox {
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
