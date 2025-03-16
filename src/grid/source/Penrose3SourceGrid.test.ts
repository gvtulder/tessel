import { describe, expect, test } from "@jest/globals";
import { SourcePoint } from "../SourceGrid";
import { Penrose3SourceGrid } from "./Penrose3SourceGrid";
import { testSourceGrid } from "../SourceGrid.test";
import { seedPRNG } from "../../geom/RandomSampler";

describe("Penrose3SourceGrid", () => {
    test("can walk the grid", () => {
        const prng = seedPRNG(1234);
        const grid = new Penrose3SourceGrid(prng);
        const shapeCounts = testSourceGrid(grid);
        expect(shapeCounts.size).toBe(2);
        expect(shapeCounts.get(grid.shapes[0])).toBeGreaterThanOrEqual(15);
        expect(shapeCounts.get(grid.shapes[1])).toBeGreaterThanOrEqual(15);
    });
});
