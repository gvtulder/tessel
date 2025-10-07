// SPDX-License-Identifier: GPL-3.0-or-later
// SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder

export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string | null,
    parentNode?: HTMLElement | null,
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (parentNode) {
        parentNode.appendChild(element);
    }
    return element;
}
