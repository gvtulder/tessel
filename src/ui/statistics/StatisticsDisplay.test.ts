/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { StatisticsDisplay } from "./StatisticsDisplay";
import { StatisticsMonitor } from "../../stats/StatisticsMonitor";

const dummyStats = {
    GameStarted: 9,
    "GameStarted.square": 1,
    HighScore: 86,
    'HighScore.{"atlas":"square","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 86,
    ShapeCompleted: 1268,
    'ShapeCompleted.{"atlas":"square","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 30,
    ShapeTileCount: 6,
    'ShapeTileCount.{"atlas":"square","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 6,
    TilePlaced: 99,
    "TilePlaced.square": 55,
    "GameStarted.triangle": 1,
    "TilePlaced.triangle": 24,
    'HighScore.{"atlas":"triangle","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    'ShapeCompleted.{"atlas":"triangle","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 1,
    'ShapeTileCount.{"atlas":"triangle","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    "GameStarted.rhombus": 1,
    'HighScore.{"atlas":"rhombus","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    'ShapeCompleted.{"atlas":"rhombus","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 1,
    'ShapeTileCount.{"atlas":"rhombus","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    "TilePlaced.rhombus": 11,
    "GameStarted.hexagon": 1,
    'HighScore.{"atlas":"hexagon","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 4,
    'ShapeCompleted.{"atlas":"hexagon","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    'ShapeTileCount.{"atlas":"hexagon","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    "TilePlaced.hexagon": 2,
    "GameStarted.pentagon": 1,
    'HighScore.{"atlas":"pentagon","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    'ShapeCompleted.{"atlas":"pentagon","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 1,
    'ShapeTileCount.{"atlas":"pentagon","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    "TilePlaced.pentagon": 1,
    "GameStarted.deltotrihex": 1,
    "TilePlaced.kite": 6,
    'HighScore.{"atlas":"deltotrihex","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    'ShapeCompleted.{"atlas":"deltotrihex","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 1,
    'ShapeTileCount.{"atlas":"deltotrihex","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    "GameStarted.penrose": 1,
    'HighScore.{"atlas":"penrose","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    'ShapeCompleted.{"atlas":"penrose","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 1,
    'ShapeTileCount.{"atlas":"penrose","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 2,
    "GameStarted.snubsquare": 1,
    'HighScore.{"atlas":"snubsquare","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 44,
    'ShapeCompleted.{"atlas":"snubsquare","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 16,
    'ShapeTileCount.{"atlas":"snubsquare","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 4,
    "GameStarted.ammannbeenker": 1,
    'HighScore.{"atlas":"ammannbeenker","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 21,
    'ShapeCompleted.{"atlas":"ammannbeenker","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 7,
    'ShapeTileCount.{"atlas":"ammannbeenker","colors":"wong4","segments":0,"uniqueTileColors":false,"rules":"same","scorer":"shape"}': 4,
};

describe("StatisticsDisplay", () => {
    test("can be shown", () => {
        const stats = StatisticsMonitor.instance;
        stats.unserialize(JSON.stringify(dummyStats));

        const screen = new StatisticsDisplay(stats);
        expect(screen.element.innerHTML).toMatch("1,268");

        screen.rescale();
        screen.destroy();
    });
});
