import { Point, distToLineSegment } from "../math";

/**
 * Adds a point to the polygon, splitting the nearest edge.
 */
export function addPointToPolygon(
    points: readonly Point[],
    newPoint: Point,
): Point[] {
    let nearestEdgeDist = 0;
    let nearestEdge = null;
    for (let i = 0; i < points.length; i++) {
        const d = distToLineSegment(
            points[i],
            points[(i + 1) % points.length],
            newPoint,
        );
        if (nearestEdge === null || d < nearestEdgeDist) {
            nearestEdgeDist = d;
            nearestEdge = i;
        }
    }
    return points.toSpliced(nearestEdge + 1, 0, newPoint);
}
