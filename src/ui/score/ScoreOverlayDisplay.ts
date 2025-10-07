/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { ScoredRegion } from "../../game/scorers/Scorer";
import { computeOutline, Vertex, Edge } from "../../lib/compute-outline";
import { SVG } from "../shared/svg";

export const Color = {
    main: "#9acd32",
    light: "#e1f0c1",
    dark: "#63851d",
};

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

    protected computeOutline(shape: ScoredRegion): {
        boundary: Vertex[];
        edgesPerVertex: Map<string, Edge[]>;
    } {
        return computeOutline(shape.segments!);
    }
}
