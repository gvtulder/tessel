/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { GridDisplay } from "../grid/GridDisplay";

export class OptionGridDisplay extends GridDisplay {
    // TODO scale based on area
    animated = false;
    margins = { top: 0, right: 0, bottom: 0, left: 0 };
}
