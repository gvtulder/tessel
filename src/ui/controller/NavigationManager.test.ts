/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
    BrowserNavigationManager,
    CustomNavigationManager,
    NavigationManager,
} from "./NavigationManager";
import { MockHistory } from "./MockHistory";

let mockHistory: MockHistory;
let realHistory: History;
beforeEach(() => {
    realHistory = window.history;
    Object.defineProperty(window, "history", {
        writable: true,
        value: (mockHistory = new MockHistory()),
    });
});
afterEach(() => {
    Object.defineProperty(window, "history", {
        writable: true,
        value: realHistory,
    });
});

describe("BrowserNavigationManager", () => {
    test("can navigate", () => {
        const onNavigate = vi.fn((reload?: boolean) => {});

        const nav = new BrowserNavigationManager();
        nav.onNavigate = onNavigate;

        nav.navigate("#pageone");
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        nav.navigate("");
        // should be deduplicated
        nav.navigate("#pageone");
        nav.navigate("#pageone");
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        nav.navigate("#pagetwo");

        expect(onNavigate).toHaveBeenCalledTimes(9);
        expect(mockHistory.history).toEqual([
            "/#pageone",
            "/#pagetwo",
            "/#pageone",
            "/",
            "/#pageone",
            "/#pagetwo",
            "/#pageone",
            "/#pagetwo",
        ]);
        expect(nav.history).toEqual([
            "#pageone",
            "#pagetwo",
            "#pageone",
            "",
            "#pageone",
            "#pagetwo",
            "#pageone",
            "#pagetwo",
        ]);
    });

    test("can go back in history", () => {
        const onNavigate = vi.fn((reload?: boolean) => {});

        const nav = new BrowserNavigationManager();
        nav.onNavigate = onNavigate;
        nav.navigate("#pageone");
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        expect(nav.history.length).toBe(3);

        expect(nav.back()).toBe(true);
        expect(onNavigate).toHaveBeenCalledTimes(4);
        expect(mockHistory.back).toHaveBeenCalledTimes(1);

        expect(nav.back()).toBe(true);
        expect(onNavigate).toHaveBeenCalledTimes(5);
        expect(mockHistory.back).toHaveBeenCalledTimes(2);

        // go beyond history
        expect(nav.back()).toBe(true);
        expect(onNavigate).toHaveBeenCalledTimes(6);
        expect(mockHistory.back).toHaveBeenCalledTimes(2);
        expect(mockHistory.history[mockHistory.length - 1]).toEqual("/");
    });

    test("can handle popstate", () => {
        const onNavigate = vi.fn((reload?: boolean) => {});

        const nav = new BrowserNavigationManager();
        nav.onNavigate = onNavigate;
        nav.navigate("#pagethree");
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        expect(nav.history.length).toBe(3);

        window.dispatchEvent(new PopStateEvent("popstate"));
        expect(onNavigate).toHaveBeenCalledTimes(4);

        window.dispatchEvent(new PopStateEvent("popstate"));
        expect(onNavigate).toHaveBeenCalledTimes(5);
    });
});

describe("CustomNavigationManager", () => {
    test("can navigate", () => {
        const onNavigate = vi.fn((reload?: boolean) => {});

        const nav = new CustomNavigationManager();
        nav.onNavigate = onNavigate;

        nav.navigate("#pageone");
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        // should reset all navigation before this point
        nav.navigate("");
        // should be deduplicated
        nav.navigate("#pageone");
        nav.navigate("#pageone");
        // should be deduplicated
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        nav.navigate("#pagetwo");

        expect(onNavigate).toHaveBeenCalledTimes(9);
        expect(mockHistory.history).toEqual([
            "/#pageone",
            "/#pagetwo",
            "/#pageone",
            "/",
            "/#pageone",
            "/#pagetwo",
            "/#pageone",
            "/#pagetwo",
        ]);
        expect(nav.history).toEqual(["", "#pageone", "#pagetwo"]);
    });

    test("can go back in history", () => {
        const onNavigate = vi.fn((reload?: boolean) => {});

        const nav = new CustomNavigationManager();
        nav.onNavigate = onNavigate;
        nav.navigate("#pagethree");
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        expect(nav.history.length).toBe(3);

        expect(nav.back()).toBe(true);
        expect(onNavigate).toHaveBeenCalledTimes(4);
        expect(mockHistory.back).toHaveBeenCalledTimes(0);
        expect(nav.history).toEqual(["#pagethree", "#pagetwo"]);

        expect(nav.back()).toBe(true);
        expect(onNavigate).toHaveBeenCalledTimes(5);
        expect(mockHistory.back).toHaveBeenCalledTimes(0);
        expect(nav.history).toEqual(["#pagethree"]);

        // go beyond history
        expect(nav.back()).toBe(false);
        expect(onNavigate).toHaveBeenCalledTimes(5);
        expect(mockHistory.back).toHaveBeenCalledTimes(0);
    });

    test("can handle popstate", () => {
        const onNavigate = vi.fn((reload?: boolean) => {});

        const nav = new CustomNavigationManager();
        nav.onNavigate = onNavigate;
        nav.navigate("#pagethree");
        nav.navigate("#pagetwo");
        nav.navigate("#pageone");
        expect(nav.history.length).toBe(3);

        window.dispatchEvent(new PopStateEvent("popstate"));
        expect(onNavigate).toHaveBeenCalledTimes(4);
        expect(nav.history).toEqual(["#pagethree", "#pagetwo"]);

        window.dispatchEvent(new PopStateEvent("popstate"));
        expect(onNavigate).toHaveBeenCalledTimes(5);
        expect(nav.history).toEqual(["#pagethree"]);

        window.dispatchEvent(new PopStateEvent("popstate"));
        expect(onNavigate).toHaveBeenCalledTimes(6);
    });

    test("can restore state", () => {
        const nav = new CustomNavigationManager();
        nav.restoreHistory(["#pagethree", "#pagetwo", "#pageone"]);
        expect(nav.history).toEqual(["#pagethree", "#pagetwo", "#pageone"]);
    });
});
