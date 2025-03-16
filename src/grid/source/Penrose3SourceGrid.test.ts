import { describe, expect, test } from "@jest/globals";
import { SourcePoint } from "../SourceGrid";
import { Penrose3SourceGrid } from "./Penrose3SourceGrid";

describe("Penrose3SourceGrid", () => {
    test("can walk the grid", () => {
        const grid = new Penrose3SourceGrid();

        const initialPoint = grid.getOrigin();
        expect(initialPoint.numSides).toBe(4);

        let wide = 0;
        let narrow = 0;
        const seen = new Set<SourcePoint>([initialPoint]);
        const queue = [initialPoint];
        while (wide + narrow < 100) {
            const point = queue.shift()!;
            if (point.shape.name == "rhombus-wide") {
                wide++;
            } else if (point.shape.name == "rhombus-narrow") {
                narrow++;
            } else {
                console.log("unknown shape", point.shape.name);
            }
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
        expect(narrow + wide).toBeGreaterThanOrEqual(100);
        expect(wide).toBeGreaterThanOrEqual(15);
        expect(narrow).toBeGreaterThanOrEqual(15);
    });
});
