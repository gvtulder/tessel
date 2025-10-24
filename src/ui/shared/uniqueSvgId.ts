/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

/**
 * Helper class to generate document-unique IDs for SVG masks and gradients.
 */
export class UniqueIdSource {
    prefix: string;
    i: number;

    constructor(prefix: string) {
        this.prefix = prefix;
        this.i = 0;
    }

    getUniqueIdPrefix() {
        this.i = (this.i + 1) % 1000000;
        return `${this.prefix}${this.i}-`;
    }
}
