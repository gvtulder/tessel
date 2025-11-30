/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export abstract class ScreenDisplay extends EventTarget {
    abstract element: HTMLElement;
    abstract rescale(): void;
    abstract destroy(): void;
}
