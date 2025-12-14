/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export abstract class NavigationManager {
    history: string[];
    onNavigate?: (reload?: boolean) => void;

    constructor() {
        this.history = [];

        window.addEventListener("popstate", () => {
            this.handlePopState();
        });
    }

    abstract restoreHistory(hashes: string[]): void;
    abstract back(): boolean;
    abstract handlePopState(): void;
    abstract navigate(hash: string, reload?: boolean): void;
}

export class BrowserNavigationManager extends NavigationManager {
    restoreHistory(hashes: string[]): void {}

    back(): boolean {
        // rely on browser history,
        // but do not leave the game
        if (this.history.length > 1) {
            // go back in in-game history
            window.history.back();
        } else {
            // go back to main page
            this.navigate("");
        }
        return true;
    }

    handlePopState(): void {
        if (this.history.length > 1) {
            this.history.pop();
        }
        if (this.onNavigate) this.onNavigate();
    }

    navigate(hash: string, reload?: boolean) {
        if (
            this.history.length == 0 ||
            this.history[this.history.length - 1] != hash
        ) {
            // add to browser history
            this.history.push(hash);
            window.history.pushState(
                {},
                "",
                `${window.location.pathname}${hash}`,
            );
        }
        if (this.onNavigate) this.onNavigate(reload);
    }
}

export class CustomNavigationManager extends NavigationManager {
    restoreHistory(hashes: string[]): void {
        for (const hash of hashes) {
            const url = `${window.location.pathname}${hash}`;
            if (this.history.length == 0) {
                window.history.replaceState({}, "", url);
            } else {
                window.history.pushState({}, "", url);
            }
            this.history.push(hash);
        }
    }

    back(): boolean {
        if (this.history.length > 1) {
            // go back to the previous page
            this.history.pop();
            const hash = this.history[this.history.length - 1];
            window.history.pushState(
                {},
                "",
                `${window.location.pathname}${hash}`,
            );
            if (this.onNavigate) this.onNavigate();
            return true;
        } else {
            // there is no previous page
            return false;
        }
    }

    handlePopState(): void {
        // make sure that we navigate to the correct page
        // according to our custom history
        if (this.history.length > 1) {
            this.history.pop();
            const hash = this.history[this.history.length - 1];
            window.history.replaceState(
                {},
                "",
                `${window.location.pathname}${hash}`,
            );
        } else {
            window.history.replaceState({}, "", `${window.location.pathname}`);
        }
        if (this.onNavigate) this.onNavigate();
    }

    navigate(hash: string, reload?: boolean) {
        if (
            this.history.length == 0 ||
            this.history[this.history.length - 1] != hash
        ) {
            if (hash == "") {
                // reset history when on main screen
                this.history = [""];
            } else {
                // deduplicate
                this.history = this.history.filter((h) => h != hash);
                this.history.push(hash);
            }
            window.history.pushState(
                {},
                "",
                `${window.location.pathname}${hash}`,
            );
        }
        if (this.onNavigate) this.onNavigate(reload);
    }
}
