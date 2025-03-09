import { GameSettings } from "./game/Game";
import { ConnectedSegmentScorer, FullTileScorer } from "./game/Scorer";
import { TileGenerators } from "./game/TileGenerator";
import {
    HexagonsAtlas,
    Penrose0Atlas,
    PenroseFreeAtlas,
    RhombusAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "./grid/Atlas";
import {
    DifferentEdgeColorsRuleSet,
    MatchEdgeColorsRuleSet,
} from "./grid/RuleSet";

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

function options<T extends { key: string }>(...entries: T[]) {
    return new Map<string, T>(entries.map((e: T) => [e.key, e]));
}

export const SetupCatalog = {
    atlas: options(
        { key: "squares", atlas: SquaresAtlas },
        { key: "triangles", atlas: TrianglesAtlas },
        { key: "rhombus", atlas: RhombusAtlas },
        { key: "hexagon", atlas: HexagonsAtlas },
    ),
    defaultAtlas: "squares",

    colors: options(
        /*
        {
            key: "default4",
            colors: ["#00c0ef", "#dd4b39", "#f39c12", "#00a65a"],
        },
        { key: "default3", colors: ["#dd4b39", "#f39c12", "#00a65a"] },
        { key: "default2", colors: ["#dd4b39", "#f39c12"] },
        { key: "oldrbkw", colors: ["red", "blue", "black", "white"] },
        */
        ...[6, 5, 4, 3, 2].map((n) => ({
            key: `wong${n}`,
            colors: [
                "#D55E00",
                "#0072B2",
                "#009E73",
                "#E69F00",
                "#56B4E9",
                "#CC79A7",
            ].filter((_, i) => i < n),
        })),
    ),
    defaultColor: "wong4",

    rules: options(
        {
            key: "same",
            rules: new MatchEdgeColorsRuleSet(),
            exampleColors: [0, 0] as [number, number],
            scorer: new ConnectedSegmentScorer(),
        },
        {
            key: "diff",
            rules: new DifferentEdgeColorsRuleSet(),
            exampleColors: [0, 1] as [number, number],
            scorer: new FullTileScorer(),
        },
    ),
    defaultRules: "same",
};
