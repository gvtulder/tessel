import { ScoredRegion } from "../grid/Scorer.js";
import { roundPathCorners } from "../lib/svg-rounded-corners.js";
import { BGCOLOR, SCALE } from "../settings.js";
import { ScoreOverlayDisplay, Vertex, Color } from "./ScoreOverlayDisplay.js";
import { dist, mean, midPoint } from "../utils.js";
import { polylabel } from "../lib/polylabel.js";

export class ScoreOverlayDisplay_Cutout extends ScoreOverlayDisplay {
    bgMask: SVGElement;
    bgMaskGroup: ReplacableGroup;
    shadowMask: SVGElement;
    shadowMaskGroup: ReplacableGroup;
    outlineFG: SVGElement;
    outlineFGGroup: ReplacableGroup;
    outlineBG: SVGElement;
    outlineBGGroup: ReplacableGroup;
    points: SVGElement;
    pointsGroup: ReplacableGroup;

    hideTimeout: number;

    build() {
        this.element.classList.add("disabled");

        this.element.addEventListener("transitionend", (evt) => {
            this.element.classList.replace("hiding", "disabled");
        });

        // background (everything not select gray)
        const bg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
        );
        bg.setAttribute("mask", "url(#scoreOverlay-bgmask");
        bg.setAttribute("x", "-1000");
        bg.setAttribute("y", "-1000");
        bg.setAttribute("width", "2000");
        bg.setAttribute("height", "2000");
        bg.setAttribute("fill", BGCOLOR);
        bg.setAttribute("opacity", "0.2");
        // this.element.appendChild(bg);

        const bgMask = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "mask",
        );
        bgMask.setAttribute("id", "scoreOverlay-bgmask");
        // this.element.append(bgMask);

        const bgBlack = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
        );
        bgBlack.setAttribute("x", "-1000");
        bgBlack.setAttribute("y", "-1000");
        bgBlack.setAttribute("width", "2000");
        bgBlack.setAttribute("height", "2000");
        bgBlack.setAttribute("fill", "white");
        bgMask.appendChild(bgBlack);

        const bgMaskG = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        bgMaskG.setAttribute("fill", "black");
        bgMask.append(bgMaskG);
        this.bgMask = bgMaskG;
        this.bgMaskGroup = new ReplacableGroup(bgMaskG);

        // drop shadow around the shape
        const shadow = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
        );
        shadow.setAttribute("mask", "url(#scoreOverlay-mask");
        shadow.setAttribute("x", "-1000");
        shadow.setAttribute("y", "-1000");
        shadow.setAttribute("width", "2000");
        shadow.setAttribute("height", "2000");
        shadow.setAttribute("fill", "black");
        this.element.appendChild(shadow);

        const shadowMask = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "mask",
        );
        shadowMask.setAttribute("class", "scoreOverlay-mask");
        shadowMask.setAttribute("id", "scoreOverlay-mask");
        this.element.append(shadowMask);

        const shadowMaskG = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        shadowMaskG.setAttribute("filter", "drop-shadow(0px 0px 10px white)");
        shadowMaskG.setAttribute("fill", "black");
        shadowMaskG.setAttribute("stroke", "black");
        shadowMaskG.setAttribute("stroke-width", "10px");
        shadowMask.append(shadowMaskG);
        this.shadowMask = shadowMaskG;
        this.shadowMaskGroup = new ReplacableGroup(shadowMaskG);

        // white outline around the shape
        const outlineBG = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        outlineBG.setAttribute("class", "scoreOverlay-outlineBG");
        outlineBG.setAttribute("stroke", BGCOLOR);
        outlineBG.setAttribute("stroke-width", "10px");
        outlineBG.setAttribute("fill", "transparent");
        this.element.append(outlineBG);
        this.outlineBG = outlineBG;
        this.outlineBGGroup = new ReplacableGroup(outlineBG);

        // green outline around the shape
        const outlineFG = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        outlineFG.setAttribute("class", "scoreOverlay-outlineFG");
        outlineFG.setAttribute("stroke", Color.main);
        outlineFG.setAttribute("stroke-width", "5px");
        outlineFG.setAttribute("fill", "transparent");
        this.element.append(outlineFG);
        this.outlineFG = outlineFG;
        this.outlineFGGroup = new ReplacableGroup(outlineFG);

        // circles with points on top
        const points = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        this.element.append(points);
        this.points = points;
        this.pointsGroup = new ReplacableGroup(points);
    }

    showScores(shapes: ScoredRegion[]) {
        const groups = [
            this.bgMaskGroup,
            this.shadowMaskGroup,
            this.outlineBGGroup,
            this.outlineFGGroup,
        ].map((g) => ({ group: g, elements: [] as SVGElement[] }));
        const points = [] as SVGElement[];

        for (const shape of shapes) {
            const outlineResult = this.computeOutline(shape);
            const boundary = outlineResult.boundary;
            const pathComponents = boundary
                .reverse()
                .map(
                    (v) =>
                        `${(v.x * SCALE).toFixed(5)},${(v.y * SCALE).toFixed(5)}`,
                );
            const roundPathString = roundPathCorners(
                "M " + pathComponents.join(" L ") + " Z",
                10,
                false,
            );

            // paths
            for (const g of groups) {
                const path = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path",
                );
                path.setAttribute("d", roundPathString);
                g.elements.push(path);
            }

            const polygon = [boundary.map((v) => [v.x, v.y])];
            const polylabelPoint = polylabel(
                polygon as [number, number][][],
                0.1,
            );

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

            const bestPoint = [polylabelPoint.x, polylabelPoint.y];
            const pointsScale = polylabelPoint.distance;

            // circle with scores
            const circle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle",
            );
            circle.setAttribute("class", "points");
            circle.setAttribute("cx", "0"); // `${bestPoint[0] * SCALE}`);
            circle.setAttribute("cy", "0"); // `${bestPoint[1] * SCALE}`);
            // circle.setAttribute('r', shape.triangles.size < 3 ? '20' : '25');
            circle.setAttribute("r", `${SCALE * 0.7}`);
            circle.setAttribute("fill", Color.light);
            circle.setAttribute("stroke", Color.dark);
            circle.setAttribute("stroke-width", "16");
            circle.setAttribute(
                "style",
                `filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2)); transform: translate(${bestPoint[0] * SCALE}px, ${bestPoint[1] * SCALE}px) scale(${pointsScale});`,
            );
            points.push(circle);

            const text = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text",
            );
            text.setAttribute("class", "points");
            text.setAttribute("x", "0"); // `${bestPoint[0] * SCALE}`);
            text.setAttribute("y", "0"); // `${bestPoint[1] * SCALE + 1}`);
            text.setAttribute("alignment-baseline", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "75");
            text.setAttribute(
                "style",
                `transform: translate(${bestPoint[0] * SCALE}px, ${bestPoint[1] * SCALE + 1}px) scale(${pointsScale});`,
            );
            text.appendChild(document.createTextNode(`${shape.points}`));
            points.push(text);
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
}

class ReplacableGroup {
    parentNode: SVGElement;
    group: SVGElement;

    constructor(parentNode: SVGElement) {
        this.parentNode = parentNode;
    }

    set contents(elements: SVGElement[]) {
        const group = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
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
