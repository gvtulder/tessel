import { ScoredRegion } from "../game/Scorer";
import { computeOutline, Vertex, Edge } from "../lib/compute-outline";
import { SVG } from "./svg";

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
    }

    abstract showScores(shapes: ScoredRegion[]): void;

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
