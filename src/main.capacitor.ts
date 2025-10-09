/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { StatusBar } from "@capacitor/status-bar";
import { removeSplash, startMainMenu } from "./main.shared";

StatusBar.hide();

removeSplash();
startMainMenu();
