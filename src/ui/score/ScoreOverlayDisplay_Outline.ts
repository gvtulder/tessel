import { ScoredRegion } from "../../game/Scorer";
import { roundPathCorners } from "../../lib/svg-rounded-corners";
import { Vertex } from "../../lib/compute-outline";
import { BGCOLOR, SCALE } from "../../settings";
import { ScoreOverlayDisplay, Color } from "./ScoreOverlayDisplay";
import { SVG } from "../svg";

export class ScoreOverlayDisplay_Outline extends ScoreOverlayDisplay {
    fg: SVGElement;
    group?: SVGElement;
    mask: SVGElement;
    maskPathGroup?: SVGElement;

    constructor() {
        super();

        const group = SVG("g", "svg-scoreOverlay-mask disabled", this.element);

        const overlayFill = SVG("rect", "svg-scoreOverlay-fill", group);
        overlayFill.setAttribute("x", "-1000");
        overlayFill.setAttribute("y", "-1000");
        overlayFill.setAttribute("width", "10000");
        overlayFill.setAttribute("height", "10000");
        overlayFill.setAttribute("fill", BGCOLOR);
        overlayFill.setAttribute("mask", "url(#scoreoverlaymask)");

        const mask = SVG("mask", null, group);
        mask.setAttribute("id", "scoreoverlaymask");

        const maskWhite = SVG("rect", "svg-scoreOverlay-fill", mask);
        maskWhite.setAttribute("x", "-1000");
        maskWhite.setAttribute("y", "-1000");
        maskWhite.setAttribute("width", "10000");
        maskWhite.setAttribute("height", "10000");
        maskWhite.setAttribute("fill", "white");
        mask.appendChild(maskWhite);

        this.mask = mask;

        const fg = SVG("g");
        this.element.append(fg);
        this.fg = fg;
    }

    showScores(shapes: ScoredRegion[]) {
        const group = SVG("g");
        const maskPathGroup = SVG("g");

        for (const shape of shapes) {
            const boundary: Vertex[] = this.computeOutline(shape).boundary;

            const pathString =
                "M " +
                boundary
                    .reverse()
                    .map((v) => `${v.x * SCALE},${v.y * SCALE}`)
                    .join(" ") +
                " Z";
            console.log(pathString);

            // outline
            const path = SVG("path");
            path.setAttribute("d", pathString);
            path.setAttribute("fill", "transparent");
            path.setAttribute("stroke", Color.main);
            path.setAttribute("stroke-width", "20");
            path.setAttribute("stroke-linecap", "round");
            group.appendChild(path);

            // add mask
            const maskPath = SVG("path");
            maskPath.setAttribute("d", pathString);
            maskPath.setAttribute("fill", "black");
            maskPathGroup.appendChild(maskPath);

            // animate path
            const pathComponents = boundary
                .reverse()
                .map((v) => `${v.x * SCALE},${v.y * SCALE}`);
            const curPath = [pathComponents.pop()];
            path.setAttribute("d", "");
            const interval = window.setInterval(() => {
                let finished = false;
                if (pathComponents.length == 0) {
                    window.clearInterval(interval);
                    finished = true;
                } else {
                    curPath.push(pathComponents.pop());
                }
                const roundPath = roundPathCorners(
                    "M " + curPath.join(" L ") + (finished ? " Z" : ""),
                    10,
                    false,
                );
                console.log(roundPath);
                path.setAttribute("d", roundPath);
            }, 50);
        }

        if (this.maskPathGroup) {
            this.mask.removeChild(this.maskPathGroup);
        }
        this.mask.appendChild(maskPathGroup);
        this.maskPathGroup = maskPathGroup;
        this.mask.classList.remove("disabled");
        this.mask.classList.add("enabled");
        this.mask.addEventListener("animationend", () => {
            this.mask.classList.replace("enabled", "disabled");
        });

        if (this.group) {
            this.fg.removeChild(this.group);
        }
        this.fg.appendChild(group);
        this.group = group;
    }
}
