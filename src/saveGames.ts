import { GameSettings } from "./game/Game";
import { TileGenerators } from "./game/TileGenerator";
import { SquaresAtlas, TrianglesAtlas } from "./geom/Atlas";

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
    initialTile: ["red", "black", "blue"],
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.permutations(["red", "black", "blue", "white"]),
    ],
});

export const defaultGameList = ["square", "triangle"];

// ["triangle", "square", "isometric", "hex"]
