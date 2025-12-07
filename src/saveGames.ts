/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { gameFromSerializedSettings, GameSettings } from "./game/Game";
import { ConnectedSegmentScorer } from "./game/scorers/ConnectedSegmentScorer";
import { FullTileScorer } from "./game/scorers/FullTileScorer";
import { ConvexShapeScorer } from "./game/scorers/ConvexShapeScorer";
import { FullVertexScorer } from "./game/scorers/FullVertexScorer";
import { TileGenerators } from "./game/TileGenerator";
import { HexagonsAtlas } from "./grid/atlas/HexagonsAtlas";
import { PenroseFreeAtlas } from "./grid/atlas/PenroseFreeAtlas";
import { SquaresAtlas } from "./grid/atlas/SquaresAtlas";
import { TrianglesAtlas } from "./grid/atlas/TrianglesAtlas";
import { RhombusAtlas } from "./grid/atlas/RhombusAtlas";
import { CairoAtlas } from "./grid/atlas/CairoAtlas";
import { DeltoTrihexAtlas } from "./grid/atlas/DeltoTrihexAtlas";
import { SnubSquareAtlas } from "./grid/atlas/SnubSquareAtlas";
import { MatchEdgeColorsRuleSet } from "./grid/rules/MatchEdgeColorsRuleSet";
import { DifferentEdgeColorsRuleSet } from "./grid/rules/DifferentEdgeColorsRuleSet";
import { TileColors } from "./grid/Tile";
import { AmmannBeenkerAtlas } from "./grid/atlas/AmmannBeenkerAtlas";
import { HoleScorer } from "./game/scorers/HoleScorer";
import { SnubSquareGridAtlas } from "./grid/atlas/SnubSquareGridAtlas";
import { Penrose3GridAtlas } from "./grid/atlas/Penrose3GridAtlas";

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

// default Wong colors
const WONG6_PUB = [
    "#D55E00",
    "#0072B2",
    "#009E73",
    "#E69F00",
    "#56B4E9",
    "#CC79A7",
] as TileColors;

/*
// for the icon
console.log(
    "WONG6 lighten 0.1",
    JSON.stringify(WONG6_PUB.map((c) => Color(c).lighten(0.1).hex())),
);

// for the game colors
console.log(
    "WONG6 lighten 0.05",
    JSON.stringify(WONG6_PUB.map((c) => Color(c).lighten(0.05).hex())),
);
*/
export const WONG6 = [
    "#E06300",
    "#0078BB",
    "#00A679",
    "#F2A700",
    "#64BAEB",
    "#D085AF",
];
const WONG4 = WONG6.filter((_, i) => i < 4);

export const lookup = new Map<string, GameSettings>();

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

lookup.set("penrose3grid", {
    atlas: Penrose3GridAtlas,
    initialTile: WONG4,
    tilesShownOnStack: 3,
    tileGenerator: [
        TileGenerators.forShapes(
            Penrose3GridAtlas.shapes,
            TileGenerators.permutations(WONG4),
            undefined,
            Penrose3GridAtlas.shapeFrequencies,
        ),
    ],
});

function options<T extends { key: string }>(...entries: T[]) {
    return new Map<string, T>(entries.map((e: T) => [e.key, e]));
}

export const SetupCatalog = {
    atlas: options(
        { key: TrianglesAtlas.id, atlas: TrianglesAtlas },
        { key: SquaresAtlas.id, atlas: SquaresAtlas },
        { key: RhombusAtlas.id, atlas: RhombusAtlas },
        { key: CairoAtlas.id, atlas: CairoAtlas },
        { key: HexagonsAtlas.id, atlas: HexagonsAtlas },
        { key: DeltoTrihexAtlas.id, atlas: DeltoTrihexAtlas },
        { key: Penrose3GridAtlas.id, atlas: Penrose3GridAtlas },
        { key: SnubSquareGridAtlas.id, atlas: SnubSquareGridAtlas },
        { key: AmmannBeenkerAtlas.id, atlas: AmmannBeenkerAtlas },
    ),
    defaultAtlas: SquaresAtlas.id,

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
            colors: WONG6.filter((_, i) => i < n),
        })),
    ),
    defaultColor: "wong4",

    rules: options(
        {
            key: MatchEdgeColorsRuleSet.id,
            rules: MatchEdgeColorsRuleSet,
            exampleColors: [0, 0] as [number, number],
        },
        {
            key: DifferentEdgeColorsRuleSet.id,
            rules: DifferentEdgeColorsRuleSet,
            exampleColors: [0, 1] as [number, number],
        },
    ),
    defaultRules: MatchEdgeColorsRuleSet.id,

    scorers: options(
        {
            key: ConnectedSegmentScorer.id,
            scorer: ConnectedSegmentScorer,
        },
        {
            key: FullTileScorer.id,
            scorer: FullTileScorer,
        },
        {
            key: ConvexShapeScorer.id,
            scorer: ConvexShapeScorer,
        },
        {
            key: FullVertexScorer.id,
            scorer: FullVertexScorer,
        },
        {
            key: HoleScorer.id,
            scorer: HoleScorer,
        },
    ),
    defaultScorer: ConnectedSegmentScorer.id,
};

for (const atlas of SetupCatalog.atlas.keys()) {
    lookup.set(
        atlas,
        gameFromSerializedSettings(SetupCatalog, {
            atlas: atlas,
            colors: "wong4",
            segments: 0,
            uniqueTileColors: false,
            rules: MatchEdgeColorsRuleSet.id,
            scorer: ConnectedSegmentScorer.id,
        })!,
    );
}

/*
export const defaultGameList = [
    ...SetupCatalog.atlas.keys()
];
*/
export const defaultGameLists = [
    ["triangle", "square", "rhombus", "hexagon"],
    [...SetupCatalog.atlas.keys()],
];
