/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export const S = 100;

export const SVG_NS = "http://www.w3.org/2000/svg";

export function SVG<K extends keyof SVGElementTagNameMap>(
    qualifiedName: K,
    className?: string | null,
    parentNode?: SVGElement | HTMLElement | null,
    attributes?: { [name: string]: string },
): SVGElementTagNameMap[K] {
    const element = document.createElementNS(SVG_NS, qualifiedName);
    if (className) {
        element.classList.add(className);
    }
    if (parentNode) {
        parentNode.appendChild(element);
    }
    if (attributes) {
        for (const name in attributes) {
            element.setAttribute(name, attributes[name]);
        }
    }
    return element;
}
