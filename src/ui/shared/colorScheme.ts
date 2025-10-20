/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { getStorageBackend } from "../../lib/storage-backend";

export async function setColorScheme() {
    let preference = await getStorageBackend().getItem("color-scheme");
    if (!preference) {
        preference = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }
    document.body.classList.toggle("dark-mode", preference == "dark");
}
