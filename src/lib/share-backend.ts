/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
    files?: string[];
    dialogTitle?: string;
}

export interface ShareI {
    canShare(): Promise<boolean>;
    share(options: ShareOptions): void;
}

class DummyShareBackend implements ShareI {
    async canShare(): Promise<boolean> {
        return false;
    }

    async share() {}
}

let shareBackend: ShareI = new DummyShareBackend();

export function getShareBackend(): ShareI {
    return shareBackend;
}

export function setShareBackend(backend: ShareI): void {
    shareBackend = backend;
}
