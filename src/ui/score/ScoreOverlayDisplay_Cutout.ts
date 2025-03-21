import { ScoredRegion } from "../../game/scorers/Scorer";
import { roundPathCorners } from "../../lib/svg-rounded-corners";
import { BGCOLOR } from "../../settings";
import { ScoreOverlayDisplay, Color } from "./ScoreOverlayDisplay";
import { polylabel } from "../../lib/polylabel";
import { S, SVG } from "../shared/svg";
import { BBox, bbox, mergeBBox } from "../../geom/math";

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
            boundaryBBox = mergeBBox(boundaryBBox, bbox(boundary));
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

            const bestPoint = polylabelPoint;
            const pointsScale = polylabelPoint.distance;

            // circle with scores
            const circle = SVG("circle", "points", null, {
                cx: "0",
                cy: "0",
                r: `${0.7 * S}`,
                fill: Color.light,
                stroke: Color.dark,
                "stroke-width": `${0.16 * S}`,
                style: `filter: drop-shadow(${0.1 * S}px ${0.1 * S}px ${0.2 * S}px rgb(0 0 0 / 0.9)); transform: translate(${(bestPoint.x * S).toFixed(4)}px, ${(bestPoint.y * S).toFixed(4)}px) scale(${pointsScale.toFixed(4)});`,
            });
            points.push(circle);

            const text = SVG("text", "points", null, {
                x: "0",
                y: "0",
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
