import { ScoredRegion } from "../grid/Scorer.js";
import { Triangle } from "../grid/Triangle.js";
import { computeOutline } from "../lib/compute-outline.js";

export const Color = {
    main: '#9acd32',
    light: '#e1f0c1',
    dark: '#63851d'
};

export type Vertex = { id: string, x: number, y: number };
export type Edge = { id: string, from: Vertex, to: Vertex, triangle : Triangle };

export abstract class ScoreOverlayDisplay {
    element : SVGElement;

    constructor() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.setAttribute('class', 'svg-scoreOverlay');

        this.build();
    }

    abstract build();
    abstract showScores(shapes : ScoredRegion[]);

    hide() {
        return;
    }

    protected computeOutline(shape : ScoredRegion) : { boundary: Vertex[], edgesPerVertex: Map<string, Edge[]> } {
        return computeOutline(shape.triangles);
    }
}
