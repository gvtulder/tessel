import { Point, dist } from "../math";

/**
 * Find the best match between the two point series.
 * Returns the smallest distance and the offset
 * such that points[i] = other[i + offset].
 */
export function matchPoints(
    points: readonly Point[],
    other: readonly Point[],
): {
    offset: number;
    dist: number;
} {
    if (other.length != points.length) {
        return null;
    }
    // attempt all starting points for a match
    let minDist = -1;
    let bestOffset = null;
    for (let offset = 0; offset < other.length; offset++) {
        let maxDist = 0;
        for (
            let i = 0;
            i < other.length && (minDist == -1 || maxDist < minDist);
            i++
        ) {
            const d = dist(other[(i + offset) % other.length], points[i]);
            maxDist = maxDist < d ? d : maxDist;
        }
        if (minDist == -1 || maxDist < minDist) {
            minDist = maxDist;
            bestOffset = offset;
        }
    }
    return { offset: bestOffset, dist: minDist };
}
