import { describe, expect, test } from "@jest/globals";
import { CentricGridBuilder } from "./GridBuilder";
import { SquaresAtlas } from "./atlas/SquaresAtlas";
import { GridColoring } from "./GridColoring";
import { seedPRNG } from "../geom/RandomSampler";
import { ColorPattern, Shape } from "./Shape";
import { DifferentEdgeColorsRuleSet, MatchEdgeColorsRuleSet } from "./RuleSet";

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
        expect(coloring.groups.size).toBe(225);
        for (const tile of grid.tiles) {
            const groupsInTile = tile.segments!.map((s) =>
                coloring.segmentToGroup.get(s),
            );
            expect(new Set(groupsInTile).size).toBe(4);
        }
    });

    test.each([
        [
            {
                numColors: 4,
                segmentColors: [[0, 1, 2, 3]],
            },
            400,
            4,
        ],
        [
            {
                numColors: 2,
                segmentColors: [
                    [0, 0, 1, 1],
                    [0, 1, 1, 0],
                ],
            },
            200,
            2,
        ],
        [
            {
                numColors: 1,
                segmentColors: [[0, 0, 0, 0]],
            },
            100,
            1,
        ],
    ])(
        "applies different-edge rules",
        (pattern: ColorPattern, numGroups: number, numGroupsInTile: number) => {
            const grid = buildGrid();
            grid.rules = new DifferentEdgeColorsRuleSet();
            const coloring = new GridColoring(grid);
            expect(coloring.groups.size).toBe(400);
            const prng = seedPRNG(12345);
            const colorPattern = new Map<Shape, ColorPattern>();
            colorPattern.set(grid.atlas.shapes[0], pattern);
            coloring.applyColorPattern(colorPattern, false, prng);
            expect(coloring.groups.size).toBe(numGroups);
            for (const tile of grid.tiles) {
                const groupsInTile = tile.segments!.map((s) =>
                    coloring.segmentToGroup.get(s),
                );
                expect(new Set(groupsInTile).size).toBe(numGroupsInTile);
            }
        },
    );

    test.each([
        [
            {
                numColors: 4,
                segmentColors: [[0, 1, 2, 3]],
            },
            225,
        ],
        [
            {
                numColors: 2,
                segmentColors: [
                    [0, 0, 1, 1],
                    [0, 1, 1, 0],
                ],
            },
            27,
        ],
        [
            {
                numColors: 1,
                segmentColors: [[0, 0, 0, 0]],
            },
            1,
        ],
    ])("applies color patterns", (pattern: ColorPattern, numGroups: number) => {
        const grid = buildGrid();
        const coloring = new GridColoring(grid);
        expect(coloring.groups.size).toBe(225);
        const prng = seedPRNG(12345);
        const colorPattern = new Map();
        colorPattern.set(grid.atlas.shapes[0], pattern);
        coloring.applyColorPattern(colorPattern, false, prng);
        expect(coloring.groups.size).toBe(numGroups);
    });

    test("applies color patterns with uniqueTileColors", () => {
        const pattern = {
            numColors: 33,
            segmentColors: [[0, 0, 1, 2]],
        };
        const grid = buildGrid();
        const coloring = new GridColoring(grid);
        expect(coloring.groups.size).toBe(225);
        const prng = seedPRNG(12345);
        const colorPattern = new Map();
        colorPattern.set(grid.atlas.shapes[0], pattern);
        coloring.applyColorPattern(colorPattern, true, prng);
        expect(coloring.groups.size).toBe(225);
    });

    test("assigns colors", () => {
        const grid = buildGrid();
        const coloring = new GridColoring(grid);
        expect(coloring.groups.size).toBe(225);
        coloring.assignColors(["red", "green", "blue"]);
    });

    test("assigns colors with conflicts", () => {
        const grid = buildGrid();
        grid.rules = new DifferentEdgeColorsRuleSet();
        const coloring = new GridColoring(grid);
        expect(coloring.groups.size).toBe(400);
        expect(coloring.assignColors(["red", "green", "blue"])).not.toBeNull();
    });

    test("returns null for impossible colorings", () => {
        const grid = buildGrid();
        grid.rules = new DifferentEdgeColorsRuleSet();
        const coloring = new GridColoring(grid);
        const colorPattern = new Map();
        colorPattern.set(grid.atlas.shapes[0], {
            numColors: 4,
            segmentColors: [[0, 1, 2, 3]],
        });
        coloring.applyColorPattern(colorPattern, true);
        expect(coloring.groups.size).toBe(400);
        expect(coloring.assignColors(["red", "green", "blue"])).toBeNull();
    });
});
