/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG } from "../geom/RandomSampler";
import { Shape } from "../grid/Shape";

export abstract class Command {
    abstract execute(prng?: PRNG): void;
    abstract undo(): void;
    abstract save(shapeMap: readonly Shape[]): unknown;
}
