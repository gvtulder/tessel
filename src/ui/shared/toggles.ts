/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { getStorageBackend } from "../../lib/storage-backend";
import icons from "./icons";
import { ThreeWayToggle } from "./ThreeWayToggle";
import { Toggle } from "./Toggle";
import { setColorScheme } from "./colorScheme";
import { msg } from "@lingui/core/macro";

type OnChangeFunction<T> = (source: T) => void;

const Set_YesNo = (key: string, onchange?: OnChangeFunction<Toggle>) => {
    return (source: Toggle) => {
        if (onchange) onchange(source);
        getStorageBackend().setItem(key, source.checked ? "yes" : "no");
    };
};

const Get_YesNoDefaultYes = (key: string) =>
    getStorageBackend()
        .getItem(key)
        .then((value: string | null) => value != "no");

const Get_YesNoDefaultNo = (key: string) =>
    getStorageBackend()
        .getItem(key)
        .then((value: string | null) => value == "yes");

export const Toggles = {
    Placeholders: (onchange?: OnChangeFunction<Toggle>) =>
        new Toggle(
            icons.boxIcon,
            msg({
                id: "ui.toggles.placeholders",
                message: "Show placeholders",
            }),
            Set_YesNo("placeholders", onchange),
            Get_YesNoDefaultYes("placeholders"),
        ),
    Autorotate: (onchange?: OnChangeFunction<Toggle>) =>
        new Toggle(
            icons.arrowsSpinIcon,
            msg({ id: "ui.toggles.autorotate", message: "Autorotate" }),
            Set_YesNo("autorotate", onchange),
            Get_YesNoDefaultYes("autorotate"),
        ),
    Hints: (onchange?: OnChangeFunction<Toggle>) =>
        new Toggle(
            icons.squareCheckIcon,
            msg({ id: "ui.toggles.hints", message: "Show hints" }),
            Set_YesNo("hints", onchange),
            Get_YesNoDefaultYes("hints"),
        ),
    Snap: (onchange?: OnChangeFunction<Toggle>) =>
        new Toggle(
            icons.magnetIcon,
            msg({ id: "ui.toggles.snap", message: "Snap" }),
            Set_YesNo("snap", onchange),
            Get_YesNoDefaultYes("snap"),
        ),
    Highscore: (onchange?: OnChangeFunction<Toggle>) =>
        new Toggle(
            icons.chartIcon,
            msg({ id: "ui.toggles.highscore", message: "Show highscore" }),
            Set_YesNo("highscore", onchange),
            Get_YesNoDefaultNo("highscore"),
        ),
    ColorScheme: (onchange?: OnChangeFunction<ThreeWayToggle>) =>
        new ThreeWayToggle(
            icons.sunIcon,
            icons.moonIcon,
            msg({ id: "ui.toggles.colorScheme.light", message: "Light mode" }),
            msg({ id: "ui.toggles.colorScheme.dark", message: "Dark mode" }),
            "light",
            "dark",
            (source: ThreeWayToggle) => {
                if (onchange) onchange(source);
                const value = source.value;
                if (value) {
                    getStorageBackend().setItem("color-scheme", value);
                } else {
                    getStorageBackend().removeItem("color-scheme");
                }
                setColorScheme();
            },
            getStorageBackend().getItem("color-scheme"),
        ),
} as const;
