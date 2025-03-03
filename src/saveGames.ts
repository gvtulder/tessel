import { GameSettings } from "./game/Game";
import { TileGenerators } from "./game/TileGenerator";
import {
    HexagonsAtlas,
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
        "#bf7e16",
        "#3c8dbc",
    ],
    tilesShownOnStack: 3,
    tileGenerator: [
        // TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.permutations([
            "#00c0ef",
            "#dd4b39",
            "#f39c12",
            "#00a65a",
            "#bf7e16",
            "#3c8dbc",
        ]),
        TileGenerators.randomSubset(70),
    ],
});

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

export const defaultGameList = ["square", "triangle", "rhombus", "hexagons"];

// ["triangle", "square", "isometric", "hex"]
