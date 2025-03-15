import { describe, expect, test } from "@jest/globals";
import { SnubSquareSourceGrid } from "./SnubSquareSourceGrid";
import { SourcePoint } from "./SourceGrid";

describe("SnubSquareSourceGrid", () => {
    test("can walk the grid", () => {
        const grid = new SnubSquareSourceGrid();

        const initialPoint = grid.getOrigin();
        expect(initialPoint.shape).toBe(grid.shapes[0]);
        expect(initialPoint.numSides).toBe(4);

        let squares = 0;
        let triangles = 0;
        const seen = new Set<SourcePoint>([initialPoint]);
        const queue = [initialPoint];
        while (seen.size < 100 && queue.length > 0) {
            const point = queue.shift()!;
            if (point.shape.name == "square") squares++;
            if (point.shape.name == "triangles") triangles++;
            for (let i = 0; i < point.numSides; i++) {
                const neighbor = point.neighbor(i);
                const reverseNeighbor = neighbor.point.neighbor(neighbor.side);
                expect(reverseNeighbor.point).toBe(point);
                if (!seen.has(neighbor.point)) {
                    queue.push(neighbor.point);
                    seen.add(neighbor.point);
                }
            }
        }
        expect(seen.size).toBeGreaterThanOrEqual(100);
        expect(seen.size).toBeGreaterThanOrEqual(30);
        expect(seen.size).toBeGreaterThanOrEqual(60);
    });
});
