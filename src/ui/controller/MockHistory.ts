/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { jest } from "@jest/globals";

export class MockHistory implements History {
    history: (string | URL | null | undefined)[];

    get length() {
        return this.history.length;
    }

    scrollRestoration: ScrollRestoration = "auto";
    state = null;

    back: jest.Mock<() => void>;
    pushState: jest.Mock<
        (data: unknown, unused: string, url?: string | URL | null) => void
    >;
    replaceState: jest.Mock<
        (data: unknown, unused: string, url?: string | URL | null) => void
    >;

    constructor() {
        this.history = [];
        this.back = jest.fn(() =>
            window.dispatchEvent(new PopStateEvent("popstate")),
        );
        this.pushState = jest.fn(
            (data: unknown, unused: string, url?: string | URL | null) =>
                this.history.push(url),
        );
        this.replaceState = jest.fn(
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
