import { ScoredRegion } from "../../game/Scorer";
import { roundPathCorners } from "../../lib/svg-rounded-corners";
import { BGCOLOR } from "../../settings";
import { ScoreOverlayDisplay, Color } from "./ScoreOverlayDisplay";
import { polylabel } from "../../lib/polylabel";
import { S, SVG } from "../shared/svg";
import { BBox, bbox, mergeBBox } from "src/geom/math";

export class ScoreOverlayDisplay_Cutout extends ScoreOverlayDisplay {
    shadowMask: SVGElement;
    shadowMaskGroup: ReplacableGroup;
    dropShadowBGRect: SVGRectElement;
    outlineFG: SVGElement;
    outlineFGGroup: ReplacableGroup;
    outlineBG: SVGElement;
    outlineBGGroup: ReplacableGroup;
    points: SVGElement;
    pointsGroup: ReplacableGroup;

    onTransitionEnd: EventListener;

    hideTimeout?: number;

    constructor() {
        super();

        this.element.classList.add("disabled");

        this.onTransitionEnd = (evt) => {
            this.element.classList.replace("hiding", "disabled");
        };
        this.element.addEventListener("transitionend", this.onTransitionEnd);

        // drop shadow around the shape
        this.dropShadowBGRect = SVG("rect", null, this.element, {
            mask: "url(#scoreOverlay-mask)",
            x: "-10",
            y: "-10",
            width: "20",
            height: "20",
            fill: "black",
        });

        const shadowMask = SVG("mask", null, this.element, {
            class: "score-overlay-mask",
            id: "scoreOverlay-mask",
        });

        const shadowMaskG = SVG("g", null, shadowMask, {
            filter: `drop-shadow(0px 0px ${0.1 * S}px white)`,
            fill: "black",
            stroke: "black",
            "stroke-width": `${0.1 * S}px`,
        });
        this.shadowMask = shadowMaskG;
        this.shadowMaskGroup = new ReplacableGroup(shadowMaskG);

        // white outline around the shape
        const outlineBG = SVG("g", null, this.element, {
            class: "outline-bg",
            stroke: BGCOLOR,
            "stroke-width": `${0.1 * S}px`,
            fill: "transparent",
        });
        this.outlineBG = outlineBG;
        this.outlineBGGroup = new ReplacableGroup(outlineBG);

        // green outline around the shape
        const outlineFG = SVG("g", null, this.element, {
            class: "outline-fg",
            stroke: Color.main,
            "stroke-width": `${0.05 * S}px`,
            fill: "transparent",
        });
        this.outlineFG = outlineFG;
        this.outlineFGGroup = new ReplacableGroup(outlineFG);

        // circles with points on top
        const points = SVG("g", null, this.element);
        this.points = points;
        this.pointsGroup = new ReplacableGroup(points);
    }

    showScores(shapes: ScoredRegion[]) {
        const groups = (
            [
                ["shadow-mask", this.shadowMaskGroup],
                ["outline-bg", this.outlineBGGroup],
                ["outline-fg", this.outlineFGGroup],
            ] as [string, ReplacableGroup][]
        ).map(([name, g]) => ({
            name: name,
            group: g,
            elements: [] as SVGElement[],
        }));
        const points = [] as SVGElement[];

        let boundaryBBox: BBox | undefined = undefined;

        for (const shape of shapes) {
            const outlineResult = this.computeOutline(shape);
            const boundary = outlineResult.boundary;
            boundaryBBox = mergeBBox(bbox(boundary));
            const pathComponents = boundary
                .reverse()
                .map((v) => `${(v.x * S).toFixed(4)},${(v.y * S).toFixed(4)}`);
            const roundPathString = roundPathCorners(
                "M " + pathComponents.join(" L ") + " Z",
                0.1,
                true,
            );

            // paths
            for (const g of groups) {
                const path = SVG("path");
                path.setAttribute("d", roundPathString);
                path.setAttribute("class", `score-outline-${g.name}`);
                g.elements.push(path);
            }

            const polylabelPoint = polylabel([boundary], 0.01);

            /*
            // find a good location for the points
            const meanX = mean(boundary.map((v) => v.x));
            const meanY = mean(boundary.map((v) => v.y));
            const center = [meanX, meanY];

            const score = (candidate : [number, number]) => {
                return dist(candidate, center);
                return -Math.min(...boundary.map((v) => dist([v.x, v.y], candidate)));
                return dist(candidate, center);
                // furthest distance from the edge
                return -Math.max(...boundary.map((v) => dist([v.x, v.y], candidate)));
                return dist(candidate, center) - 10 * Math.max(...boundary.map((v) => dist([v.x, v.y], candidate)));
                return -Math.min(...boundary.map((v) => dist([v.x, v.y], candidate)));
                return -mean(boundary.map((v) => dist([v.x, v.y], candidate)));
                return dist(candidate, center);
                return -Math.max(...boundary.map((v) => dist([v.x, v.y], candidate)));
                return -Math.min(...boundary.map((v) => dist([v.x, v.y], candidate)));
            }

            let bestScore = 0;
            let bestPoint = center;
            const updateBest = (candidate : [number, number]) => {
                const d = score(candidate);
                if (bestPoint === center || d < bestScore) {
                    bestScore = d;
                    bestPoint = candidate;
                }
            }

            for (const edge of shape.edges) {
                updateBest([edge.from.left + edge.from.center[0], edge.from.top + edge.from.center[1]]);
                // mid-points between two triangles
                updateBest([(edge.from.left + edge.from.center[0] + edge.to.left + edge.to.center[0]) / 2,
                            (edge.from.top + edge.from.center[1] + edge.to.top + edge.to.center[1]) / 2]);
            }
            for (const [vertexId, edges] of outlineResult.edgesPerVertex.entries()) {
                // point between three triangles of the same color
                if (edges.length == 12) {
                    const vertex = (edges[0].from.id == vertexId) ? edges[0].from : edges[0].to;
                    updateBest([vertex.x, vertex.y]);
                }
                // points between two midpoints
                for (const a of edges) {
                    for (const b of edges) {
                        const midA = [(a.from.x + a.to.x) / 2, (a.from.y + a.to.y) / 2];
                        const midB = [(b.from.x + b.to.x) / 2, (b.from.y + b.to.y) / 2];
                        updateBest([(midA[0] + midB[0]) / 2, (midB[1] + midB[1]) / 2]);
                    }
                }
            }
            */

            const bestPoint = polylabelPoint;
            const pointsScale = polylabelPoint.distance;

            // circle with scores
            const circle = SVG("circle", "points", null, {
                cx: "0", // `${bestPoint[0] * SCALE}`,
                cy: "0", // `${bestPoint[1] * SCALE}`,
                // r: shape.triangles.size < 3 ? "20" : "25",
                r: `${0.7 * S}`,
                fill: Color.light,
                stroke: Color.dark,
                "stroke-width": `${0.16 * S}`,
                style: `filter: drop-shadow(${0.1 * S}px ${0.1 * S}px ${0.2 * S}px rgb(0 0 0 / 0.9)); transform: translate(${(bestPoint.x * S).toFixed(4)}px, ${(bestPoint.y * S).toFixed(4)}px) scale(${pointsScale.toFixed(4)});`,
            });
            points.push(circle);

            const text = SVG("text", "points", null, {
                x: "0", // `${bestPoint[0] * SCALE}`,
                y: "0", // `${bestPoint[1] * SCALE + 1}`,
                "alignment-baseline": "middle",
                "dominant-baseline": "middle",
                "text-anchor": "middle",
                "font-size": `${0.75 * S}`,
                style: `transform: translate(${(bestPoint.x * S).toFixed(4)}px, ${((bestPoint.y + 0.01) * S).toFixed(4)}px) scale(${pointsScale.toFixed(4)});`,
            });
            text.appendChild(document.createTextNode(`${shape.points}`));
            points.push(text);
        }

        if (boundaryBBox) {
            this.dropShadowBGRect.setAttribute(
                "x",
                `${(S * (boundaryBBox.minX - 0.5)).toFixed(4)}`,
            );
            this.dropShadowBGRect.setAttribute(
                "y",
                `${(S * (boundaryBBox.minY - 0.5)).toFixed(4)}`,
            );
            this.dropShadowBGRect.setAttribute(
                "width",
                `${(S * (boundaryBBox.maxX - boundaryBBox.minX + 1)).toFixed(4)}`,
            );
            this.dropShadowBGRect.setAttribute(
                "height",
                `${(S * (boundaryBBox.maxY - boundaryBBox.minY + 1)).toFixed(4)}`,
            );
        }

        for (const g of groups) {
            g.group.contents = g.elements;
        }
        this.pointsGroup.contents = points;

        this.element.classList.remove("disabled");
        this.element.classList.remove("hiding");
        this.element.classList.add("enabled");
        this.scheduleHide();
    }

    scheduleHide() {
        if (this.hideTimeout) window.clearTimeout(this.hideTimeout);
        this.hideTimeout = window.setTimeout(() => {
            this.hide();
        }, 3000);
    }

    hide() {
        if (this.hideTimeout) window.clearTimeout(this.hideTimeout);
        if (this.element.classList.contains("enabled")) {
            this.element.classList.remove("enabled");
            this.element.classList.add("hiding");
        }
    }

    destroy() {
        super.destroy();
        this.element.removeEventListener("transitionend", this.onTransitionEnd);
    }
}

class ReplacableGroup {
    parentNode: SVGElement;
    group?: SVGElement;

    constructor(parentNode: SVGElement) {
        this.parentNode = parentNode;
    }

    set contents(elements: SVGElement[]) {
        const group = SVG("g");
        for (const element of elements) {
            group.appendChild(element);
        }
        if (this.group) {
            this.parentNode.replaceChild(group, this.group);
        } else {
            this.parentNode.appendChild(group);
        }
        this.group = group;
    }
}
