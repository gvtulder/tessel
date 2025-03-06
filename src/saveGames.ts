import { GameSettings } from "./game/Game";
import { TileGenerators } from "./game/TileGenerator";
import {
    HexagonsAtlas,
    Penrose0Atlas,
    PenroseFreeAtlas,
    RhombusAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "./geom/Atlas";

const COLORS = [
    "red",
    "green",
    "blue",
    "black",
    "orange",
    "purple",
    "grey",
    "orange",
    "green",
];

export const lookup = new Map<string, GameSettings>();

lookup.set("square", {
    atlas: SquaresAtlas,
    initialTile: ["#00c0ef", "#dd4b39", "#f39c12", "#00a65a"],
    tilesShownOnStack: 3,
    tileGenerator: [
        // TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.permutations([
            "#00c0ef",
            "#dd4b39",
            "#f39c12",
            "#00a65a",
        ]),
    ],
});

lookup.set("square5", {
    atlas: SquaresAtlas,
    initialTile: ["red", "black", "blue", "white"],
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.randomSubset(5),
    ],
});

lookup.set("squareUnique", {
    atlas: SquaresAtlas,
    initialTile: ["#00c0ef", "#dd4b39", "#f39c12", "#00a65a"],
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.permutations([
            "#00c0ef",
            "#dd4b39",
            "#f39c12",
            "#00a65a",
        ]),
        TileGenerators.onlyUniqueColors(),
        TileGenerators.repeat(10),
    ],
});

lookup.set("triangle", {
    atlas: TrianglesAtlas,
    initialTile: ["#00c0ef", "#dd4b39", "#f39c12"],
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.permutations([
            "#00c0ef",
            "#dd4b39",
            "#f39c12",
            "#00a65a",
        ]),
        TileGenerators.repeat(3),
    ],
});

lookup.set("hexagons", {
    atlas: HexagonsAtlas,
    initialTile: [
        "#00c0ef",
        "#dd4b39",
        "#f39c12",
        "#00a65a",
        "#7554e0",
        "#a1c725",
    ],
    tilesShownOnStack: 3,
    tileGenerator: [
        // TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.permutations([
            "#00c0ef",
            "#dd4b39",
            "#f39c12",
            "#00a65a",
            "#7554e0",
            "#a1c725",
        ]),
        TileGenerators.randomSubset(70),
    ],
});

/*
lookup.set("cairo5", {
    atlas: CairoAtlas,
    initialTile: [
        "#00c0ef",
        "#dd4b39",
        "#f39c12",
        "#00a65a",
        "#7554e0",
    ],
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.permutations([
            "#00c0ef",
            "#dd4b39",
            "#f39c12",
            "#00a65a",
            "#7554e0",
        ]),
        TileGenerators.randomSubset(70),
    ],
});
*/

lookup.set("rhombus", {
    atlas: RhombusAtlas,
    initialTile: ["#00c0ef", "#dd4b39", "#f39c12", "#00a65a"],
    tilesShownOnStack: 3,
    tileGenerator: [
        // TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.permutations([
            "#00c0ef",
            "#dd4b39",
            "#f39c12",
            "#00a65a",
        ]),
    ],
});

lookup.set("penrose3", {
    atlas: PenroseFreeAtlas,
    //  initialTile: ["#00c0ef", "#dd4b39", "#f39c12", "#00a65a"],
    initialTile: ["#00c0ef", "#dd4b39", "#00c0ef", "#dd4b39"],
    tilesShownOnStack: 5,
    tileGenerator: [
        TileGenerators.forShapes(
            PenroseFreeAtlas.shapes,
            TileGenerators.permutations([
                "#00c0ef",
                "#dd4b39",
                //              "#f39c12",
                //              "#00a65a",
            ]),
        ),
        TileGenerators.repeat(6),
    ],
});

export const defaultGameList = ["square", "triangle", "rhombus", "hexagons"];

// ["triangle", "square", "isometric", "hex"]
