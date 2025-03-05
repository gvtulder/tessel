import { Point } from "./math";

export type TransformComponent = {
    dx?: number;
    dy?: number;
    scale?: number;
    rotation?: number;
    originX?: number;
    originY?: number;
};

/**
 * Maintains a list of transforms and can apply these to points.
 */
export class TransformList extends Array<TransformComponent> {
    /**
     * Apply the transforms in forward order.
     */
    applyForward(p: Point): Point {
        let x = p.x;
        let y = p.y;
        for (const t of this) {
            x -= t.originX || 0;
            y -= t.originY || 0;
            if (t.scale) {
                x *= t.scale;
                y *= t.scale;
            }
            if (t.rotation) {
                const origX = x;
                x = Math.cos(t.rotation) * x - Math.sin(t.rotation) * y;
                y = Math.sin(t.rotation) * origX + Math.cos(t.rotation) * y;
            }
            x += (t.dx || 0) + (t.originX || 0);
            y += (t.dy || 0) + (t.originY || 0);
        }
        return { x, y };
    }

    /**
     * Apply the transforms in reverse order.
     */
    applyBackward(p: Point): Point {
        let x = p.x;
        let y = p.y;
        for (let i = this.length - 1; i >= 0; i--) {
            const t = this[i];
            x -= (t.dx || 0) + (t.originX || 0);
            y -= (t.dy || 0) + (t.originY || 0);
            if (t.rotation) {
                const origX = x;
                x = Math.cos(-t.rotation) * x - Math.sin(-t.rotation) * y;
                y = Math.sin(-t.rotation) * origX + Math.cos(-t.rotation) * y;
                x -= t.originX || 0;
                y -= t.originY || 0;
            }
            if (t.scale) {
                x /= t.scale;
                y /= t.scale;
            }
            x += t.originX || 0;
            y += t.originY || 0;
        }
        return { x, y };
    }
}
