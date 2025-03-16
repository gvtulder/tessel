import { dist, midpoint, Point } from "../math";

export type Circle = {
    readonly center: Point;
    readonly radius: number;
};

export function smallestCircle(points: readonly Point[]): Circle {
    return welzl([...points], [], points.length);
}

// Welzl algorithm
// https://en.wikipedia.org/wiki/Smallest-circle_problem

// implementation based on
// https://www.geeksforgeeks.org/minimum-enclosing-circle-using-welzls-algorithm/

/**
 * Returns the MEC using Welzl's algorithm
 * Takes a set of input points p and a set r
 * points on the circle boundary.
 * n represents the number of points in p
 * that are not yet processed.
 */
function welzl(P: Point[], R: Point[], n: number): Circle {
    // Base case when all points processed or |r| = 3
    if (n == 0 || R.length == 3) {
        return minCircleTrivial(R);
    }

    // Pick a random point randomly
    const idx = Math.floor(Math.random() * n);
    const pnt = P[idx];

    // Put the picked point at the end of p
    // since it's more efficient than
    // deleting from the middle of the vector
    const tmp = P[idx];
    P[idx] = P[n - 1];
    P[n - 1] = tmp;

    // Get the MEC circle d from the
    // set of points p - {p}
    const d = welzl(P, [...R], n - 1);

    // If d contains pnt, return d
    if (isInside(d, pnt)) {
        return d;
    }

    // Otherwise, must be on the boundary of the MEC
    R.push(pnt);

    // Return the MEC for p - {p} and r U {p}
    return welzl(P, [...R], n - 1);
}

/**
 * Returns the minimum enclosing circle for <= 3 points.
 */
function minCircleTrivial(points: readonly Point[]): Circle {
    if (points.length == 0) {
        return { center: { x: 0, y: 0 }, radius: 0 };
    } else if (points.length == 1) {
        return { center: points[0], radius: 0 };
    } else if (points.length == 2) {
        return circleFromTwo(points[0], points[1]);
    } else if (points.length == 3) {
        // To check if MEC can be determined
        // by 2 points only
        for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 3; j++) {
                const circle = circleFromTwo(points[i], points[j]);
                if (isValidCircle(circle, points)) {
                    return circle;
                }
            }
        }
        return circleFromThree(points[0], points[1], points[2]);
    } else {
        throw new Error("Expected to find at most three points.");
    }
}

/**
 * Returns the smallest circle that intersects two points.
 */
function circleFromTwo(a: Point, b: Point): Circle {
    return {
        center: midpoint(a, b),
        radius: dist(a, b) / 2,
    };
}

/**
 * Returns the smallest circle that intersects three points.
 */
function circleFromThree(a: Point, b: Point, c: Point): Circle {
    let center = getCircleCenter(b.x - a.x, b.y - a.y, c.x - a.x, c.y - a.y);
    center = { x: center.x + a.x, y: center.y + a.y };
    return { center: center, radius: dist(center, a) };
}

/**
 * Helper method to get a circle defined by 3 points.
 */
function getCircleCenter(
    bx: number,
    by: number,
    cx: number,
    cy: number,
): Point {
    const b = bx * bx + by * by;
    const c = cx * cx + cy * cy;
    const d = bx * cy - by * cx;
    return { x: (cy * b - by * c) / (2 * d), y: (bx * c - cx * b) / (2 * d) };
}

/**
 * Function to check whether a point lies inside
 * or on the boundaries of the circle.
 */
function isInside(c: Circle, p: Point): boolean {
    return dist(c.center, p) <= c.radius;
}

/**
 * Function to check whether a circle
 * encloses the given points
 */
function isValidCircle(c: Circle, points: readonly Point[]): boolean {
    for (const p of points) {
        if (!isInside(c, p)) return false;
    }
    return true;
}
