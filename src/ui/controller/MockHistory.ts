/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Mock, vi } from "vitest";

export class MockHistory implements History {
    history: (string | URL | null | undefined)[];

    get length() {
        return this.history.length;
    }

    scrollRestoration: ScrollRestoration = "auto";
    state = null;

    back: Mock<() => unknown>;
    pushState: Mock<
        (data: unknown, unused: string, url?: string | URL | null) => unknown
    >;
    replaceState: Mock<
        (data: unknown, unused: string, url?: string | URL | null) => unknown
    >;

    constructor() {
        this.history = [];
        this.back = vi.fn(() =>
            window.dispatchEvent(new PopStateEvent("popstate")),
        );
        this.pushState = vi.fn(
            (data: unknown, unused: string, url?: string | URL | null) =>
                this.history.push(url),
        );
        this.replaceState = vi.fn(
            (data: unknown, unused: string, url?: string | URL | null) =>
                (this.history[this.history.length - 1] = url),
        );
    }

    forward(): void {
        throw new Error("Method not implemented.");
    }

    go(delta?: number): void {
        throw new Error("Method not implemented.");
    }
}
