/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { ScoredRegion } from "../../game/scorers/Scorer";
import { SVG } from "../shared/svg";

export abstract class ScoreOverlayDisplay {
    element: SVGElement;

    constructor() {
        this.element = SVG("g", "svg-score-overlay");
    }

    abstract showScores(shapes: ScoredRegion[]): void;

    hide() {
        return;
    }

    destroy() {
        this.element.remove();
    }
}
