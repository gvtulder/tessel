import { describe, expect, jest, test } from "@jest/globals";
import { CentricGridBuilder } from "./GridBuilder";
import {
    Atlas,
    HexagonsAtlas,
    RhombusAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "./Atlas";

describe("GridBuilder", () => {
    test.each([
        ["SquaresAtlas", SquaresAtlas],
        ["TrianglesAtlas", TrianglesAtlas],
        ["RhombusAtlas", RhombusAtlas],
        ["HexagonsAtlas", HexagonsAtlas],
    ] as [string, Atlas][])(
        "builds a grid for %s",
        (_: string, atlas: Atlas) => {
            const builder = new CentricGridBuilder();
            const grid = builder.buildGrid(atlas, 100);
            expect(grid.tiles.size).toBe(100);
        },
    );
});
