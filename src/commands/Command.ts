/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { PRNG } from "../geom/RandomSampler";
import { Shape } from "../grid/Shape";

/**
 * A command for the undo/redo history encapsulating a command
 * and its parameters.
 */
export abstract class Command {
    /**
     * Executes the command.
     * @param prng an optional random number source
     */
    abstract execute(prng?: PRNG): void;

    /**
     * Reverts the command.
     */
    abstract undo(): void;

    /**
     * Serializes the command state.
     * @param shapeMap a mapping from numbers to shape objects
     */
    abstract save(shapeMap: readonly Shape[]): unknown;
}
