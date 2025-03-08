import { describe, expect, jest, test } from "@jest/globals";
import { CentricGridBuilder } from "./GridBuilder";
import {
    Atlas,
    HexagonsAtlas,
    Penrose0Atlas,
    RhombusAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "./Atlas";

describe("GridBuilder", () => {
    test.each([
        SquaresAtlas,
        TrianglesAtlas,
        RhombusAtlas,
        HexagonsAtlas,
        Penrose0Atlas,
    ])("builds a grid", (atlas: Atlas) => {
        const builder = new CentricGridBuilder();
        const grid = builder.buildGrid(atlas, 100);
        expect(grid.tiles.size).toBe(100);
    });
});
