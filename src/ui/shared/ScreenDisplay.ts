/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export interface ScreenDisplay extends EventTarget {
    element: HTMLElement;
    rescale(): void;
    destroy(): void;
}
