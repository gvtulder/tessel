import { describe, expect, jest, test } from "@jest/globals";
import { CentricGridBuilder } from "./GridBuilder";
import { SquaresAtlas } from "./Atlas";
import { GridColoring } from "./GridColoring";
import { seedPRNG } from "./RandomSampler";
import { ColorPattern } from "./Shape";

describe("GridColoring", () => {
    const buildGrid = (prng = seedPRNG(12345)) => {
        const atlas = SquaresAtlas;
        const builder = new CentricGridBuilder();
        const grid = builder.buildGrid(atlas, 100, prng);
        expect(grid.tiles.size).toBe(100);
        return grid;
    };

    test("computes color groups", () => {
        const grid = buildGrid();
        const coloring = new GridColoring(grid);
        expect(coloring.groups.size).toBe(227);
        for (const tile of grid.tiles) {
            const groupsInTile = tile.segments!.map((s) =>
                coloring.segmentToGroup.get(s),
            );
            expect(new Set(groupsInTile).size).toBe(4);
        }
    });

    test.each([
        [
            [
                {
                    numColors: 4,
                    segmentColors: [0, 1, 2, 3],
                },
            ],
            227,
        ],
        [
            [
                {
                    numColors: 2,
                    segmentColors: [0, 0, 1, 1],
                },
            ],
            31,
        ],
        [
            [
                {
                    numColors: 1,
                    segmentColors: [0, 0, 0, 0],
                },
            ],
            1,
        ],
    ])(
        "applies color patterns",
        (patterns: ColorPattern[], numGroups: number) => {
            const grid = buildGrid();
            const coloring = new GridColoring(grid);
            expect(coloring.groups.size).toBe(227);

            const prng = seedPRNG(12345);

            const colorPattern = new Map();
            colorPattern.set(grid.atlas.shapes[0], patterns);
            coloring.applyColorPattern(colorPattern, prng);
            expect(coloring.groups.size).toBe(numGroups);
        },
    );

    test("assigns colors", () => {
        const grid = buildGrid();
        const coloring = new GridColoring(grid);
        expect(coloring.groups.size).toBe(227);
        coloring.assignColors(["red", "green", "blue"]);
    });
});
