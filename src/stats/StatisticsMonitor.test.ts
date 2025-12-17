/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "vitest";
import { StatisticsMonitor } from "./StatisticsMonitor";
import { StatisticsEvent } from "./Events";
import { getStorageBackend } from "../lib/storage-backend";

describe("StatisticsMonitor", () => {
    test("countEvent", () => {
        const stats = StatisticsMonitor.instance;
        const event = StatisticsEvent.GameStarted;
        getStorageBackend().removeItem("statistics");
        stats.storageBackend = getStorageBackend();
        stats.counters.clear();

        stats.countEvent(event, "squares");
        expect(stats.counters.get(event)).toBe(1);
        expect(stats.counters.get(`${event}.squares`)).toBe(1);

        stats.countEvent(event, "triangles");
        expect(stats.counters.get(event)).toBe(2);
        expect(stats.counters.get(`${event}.squares`)).toBe(1);
        expect(stats.counters.get(`${event}.triangles`)).toBe(1);
    });

    test("updateHighScore", () => {
        const stats = StatisticsMonitor.instance;
        const event = StatisticsEvent.HighScore;
        getStorageBackend().removeItem("statistics");
        stats.storageBackend = getStorageBackend();
        stats.counters.clear();

        stats.updateHighScore(event, 12, "squares");
        expect(stats.counters.get(event)).toBe(12);
        expect(stats.counters.get(`${event}.squares`)).toBe(12);

        stats.updateHighScore(event, 123, "triangles");
        expect(stats.counters.get(event)).toBe(123);
        expect(stats.counters.get(`${event}.squares`)).toBe(12);
        expect(stats.counters.get(`${event}.triangles`)).toBe(123);
    });

    test("serialize and unserialize", async () => {
        const stats = StatisticsMonitor.instance;
        const event = StatisticsEvent.HighScore;
        getStorageBackend().removeItem("statistics");
        stats.storageBackend = getStorageBackend();
        stats.counters.clear();

        stats.updateHighScore(event, 12, "squares");
        expect(stats.counters.get(event)).toBe(12);
        expect(stats.counters.get(`${event}.squares`)).toBe(12);
        await new Promise((resolve) => setTimeout(resolve, 300));

        const oldStats = localStorage.getItem("statistics")!;
        expect(oldStats).not.toBeNull();
        stats.updateHighScore(event, 123, "squares");
        expect(stats.counters.get(event)).toBe(123);
        await new Promise((resolve) => setTimeout(resolve, 300));

        localStorage.setItem("statistics", oldStats);

        stats.storageBackend = getStorageBackend();
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(stats.counters.get(event)).toBe(12);
        expect(stats.counters.get(`${event}.squares`)).toBe(12);
    });
});
