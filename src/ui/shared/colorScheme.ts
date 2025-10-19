/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

export function setColorScheme() {
    let preference = localStorage.getItem("color-scheme");
    if (!preference) {
        preference = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }
    document.body.classList.toggle("dark-mode", preference == "dark");
}
