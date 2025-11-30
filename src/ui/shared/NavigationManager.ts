/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export class NavigationManager {
    useCustomHistory: boolean;
    history: string[];
    onNavigate?: () => void;

    constructor(useCustomHistory: boolean) {
        this.useCustomHistory = useCustomHistory;
        this.history = [];

        window.addEventListener("popstate", () => {
            this.handlePopState();
        });
    }

    restoreHistory(hashes: string[]): void {
        if (this.useCustomHistory) {
            for (const hash of hashes) {
                const url = `${window.location.pathname}${hash}`;
                if (this.history.length == 0) {
                    window.history.replaceState({}, "", url);
                } else {
                    window.history.pushState({}, "", url);
                }
                this.history.push(hash);
            }
        } else {
            // no specific handling for browser-based history
            this.history.push(...hashes);
        }
    }

    back(): boolean {
        if (this.useCustomHistory) {
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
        } else {
            // rely on browser history
            window.history.back();
            return true;
        }
    }

    handlePopState(): void {
        if (this.useCustomHistory) {
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
                window.history.replaceState(
                    {},
                    "",
                    `${window.location.pathname}`,
                );
            }
        } else {
            if (this.history.length > 1) {
                this.history.pop();
            }
        }
        if (this.onNavigate) this.onNavigate();
    }

    navigate(hash: string) {
        if (this.useCustomHistory) {
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
        } else {
            // add to browser history
            this.history.push(hash);
            window.history.pushState(
                {},
                "",
                `${window.location.pathname}${hash}`,
            );
        }
        if (this.onNavigate) this.onNavigate();
    }
}
