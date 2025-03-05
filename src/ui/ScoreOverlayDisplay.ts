import { ScoredRegion } from "../game/Scorer.js";
import { computeOutline, Vertex, Edge } from "../lib/compute-outline.js";
import { SVG } from "./svg.js";

export const Color = {
    main: "#9acd32",
    light: "#e1f0c1",
    dark: "#63851d",
};

export abstract class ScoreOverlayDisplay {
    element: SVGElement;

    constructor() {
        this.element = SVG("g");
        this.element.setAttribute("class", "svg-scoreOverlay");

        this.build();
    }

    abstract build();
    abstract showScores(shapes: ScoredRegion[]);

    hide() {
        return;
    }

    protected computeOutline(shape: ScoredRegion): {
        boundary: Vertex[];
        edgesPerVertex: Map<string, Edge[]>;
    } {
        return computeOutline(shape.segments);
    }
}
