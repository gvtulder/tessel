import { GameSettings } from "./game/Game";
import {
    ConnectedSegmentScorer,
    ConvexShapeScorer,
    FullTileScorer,
    FullVertexScorer,
} from "./game/Scorer";
import { TileGenerators } from "./game/TileGenerator";
import {
    Atlas,
    CairoAtlas,
    DeltoTrihexAtlas,
    HexagonsAtlas,
    Penrose0Atlas,
    PenroseFreeAtlas,
    RhombusAtlas,
    SnubSquareAtlas,
    SnubSquareFreeAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "./grid/Atlas";
import {
    DifferentEdgeColorsRuleSet,
    MatchEdgeColorsRuleSet,
} from "./grid/RuleSet";
import { SnubSquareSourceGrid } from "./grid/source/SnubSquareSourceGrid";
import { Tile, TileColors } from "./grid/Tile";

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

const OLD4 = ["#00c0ef", "#dd4b39", "#f39c12", "#00a65a"] as TileColors;

const OLD6 = [
    "#00c0ef",
    "#dd4b39",
    "#f39c12",
    "#00a65a",
    "#7554e0",
    "#a1c725",
] as TileColors;

const WONG4 = ["#D55E00", "#0072B2", "#009E73", "#E69F00"] as TileColors;

const WONG6 = [
    "#D55E00",
    "#0072B2",
    "#009E73",
    "#E69F00",
    "#56B4E9",
    "#CC79A7",
] as TileColors;

export const lookup = new Map<string, GameSettings>();

lookup.set("square", {
    atlas: SquaresAtlas,
    initialTile: WONG4,
    tilesShownOnStack: 3,
    tileGenerator: [
        // TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.permutations(WONG4),
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
    initialTile: WONG4,
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.permutations(WONG4),
        TileGenerators.onlyUniqueColors(),
        TileGenerators.repeat(10),
    ],
});

lookup.set("triangle", {
    atlas: TrianglesAtlas,
    initialTile: [WONG4[0], WONG4[1], WONG4[2]],
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.permutations(WONG4),
        TileGenerators.repeat(3),
    ],
});

lookup.set("hexagons", {
    atlas: HexagonsAtlas,
    initialTile: WONG6,
    tilesShownOnStack: 3,
    tileGenerator: [
        // TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.permutations(WONG6),
        TileGenerators.randomSubset(70),
    ],
});

/*
lookup.set("twopentagons", {
    atlas: TwoPentagonAtlas,
    initialTile: [...WONG4, ...WONG4],
    tilesShownOnStack: 3,
    tileGenerator: [
        // TileGenerators.permutations(["red", "black", "blue", "white"]),
        TileGenerators.permutations(WONG4),
        TileGenerators.randomSubset(70),
    ],
});
*/

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
    initialTile: WONG4,
    tilesShownOnStack: 3,
    tileGenerator: [TileGenerators.permutations(WONG4)],
});

lookup.set("cairo5", {
    atlas: CairoAtlas,
    initialTile: [...WONG4, WONG4[2]],
    tilesShownOnStack: 3,
    tileGenerator: [TileGenerators.permutations(WONG4)],
});

lookup.set("deltotrihex", {
    atlas: DeltoTrihexAtlas,
    initialTile: WONG4,
    tilesShownOnStack: 3,
    tileGenerator: [TileGenerators.permutations(WONG4)],
});

lookup.set("snubsquare", {
    atlas: SnubSquareAtlas,
    initialTile: WONG4,
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.forShapes(
            SnubSquareAtlas.shapes,
            TileGenerators.permutations(WONG4),
            undefined,
            SnubSquareAtlas.shapeFrequencies,
        ),
    ],
});

const SnubSquareGridAtlas = Atlas.fromSourceGrid(new SnubSquareSourceGrid());
lookup.set("snubsquaregrid", {
    atlas: SnubSquareGridAtlas,
    initialTile: WONG4,
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.forShapes(
            SnubSquareGridAtlas.shapes,
            TileGenerators.permutations(WONG4),
            undefined,
            SnubSquareGridAtlas.shapeFrequencies,
        ),
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
            undefined,
            PenroseFreeAtlas.shapeFrequencies,
        ),
        TileGenerators.repeat(6),
    ],
});

export const defaultGameList = ["triangle", "square", "rhombus", "hexagons"];

// ["triangle", "square", "isometric", "hex"]

function options<T extends { key: string }>(...entries: T[]) {
    return new Map<string, T>(entries.map((e: T) => [e.key, e]));
}

export const SetupCatalog = {
    atlas: options(
        { key: "square", atlas: SquaresAtlas },
        { key: "triangle", atlas: TrianglesAtlas },
        { key: "rhombus", atlas: RhombusAtlas },
        { key: "pentagon", atlas: CairoAtlas },
        { key: "hexagon", atlas: HexagonsAtlas },
        { key: "deltotrihex", atlas: DeltoTrihexAtlas },
        { key: "penrose", atlas: PenroseFreeAtlas },
        { key: "snubsquare", atlas: SnubSquareGridAtlas },
    ),
    defaultAtlas: "square",

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
            // scorer: new FullTileScorer(),
            // scorer: new ConvexShapeScorer(),
            scorer: new FullVertexScorer(),
        },
    ),
    defaultRules: "same",
};
