/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export const StatisticsEvent = {
    TilePlaced: "TilePlaced",
    ShapeCompleted: "ShapeCompleted",
    GameStarted: "GameStarted",
    GameCompleted: "GameCompleted",
    HighScore: "HighScore",
    ShapeTileCount: "ShapeTileCount",
};
export type StatisticsEvent =
    (typeof StatisticsEvent)[keyof typeof StatisticsEvent];
