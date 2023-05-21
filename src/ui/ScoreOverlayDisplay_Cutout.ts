import { Shape } from "src/grid/Scorer.js";
import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { BGCOLOR, SCALE } from "src/settings.js";
import { ScoreOverlayDisplay, Vertex, Color } from "./ScoreOverlayDisplay.js";

export class ScoreOverlayDisplay_Cutout extends ScoreOverlayDisplay {
    bgMask : SVGElement;
    bgMaskGroup : ReplacableGroup;
    shadowMask : SVGElement;
    shadowMaskGroup : ReplacableGroup;
    outlineFG : SVGElement;
    outlineFGGroup : ReplacableGroup;
    outlineBG : SVGElement;
    outlineBGGroup : ReplacableGroup;

    build() {
        // background (everything not select gray)
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('mask', 'url(#scoreOverlay-bgmask');
        bg.setAttribute('x', '-1000');
        bg.setAttribute('y', '-1000');
        bg.setAttribute('width', '2000');
        bg.setAttribute('height', '2000');
        bg.setAttribute('fill', BGCOLOR);
        bg.setAttribute('opacity', '0.5');
        this.element.appendChild(bg);

        const bgMask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        bgMask.setAttribute('id', 'scoreOverlay-bgmask');
        this.element.append(bgMask);

        const bgBlack = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgBlack.setAttribute('x', '-1000');
        bgBlack.setAttribute('y', '-1000');
        bgBlack.setAttribute('width', '2000');
        bgBlack.setAttribute('height', '2000');
        bgBlack.setAttribute('fill', 'white');
        bgMask.appendChild(bgBlack);

        const bgMaskG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bgMaskG.setAttribute('fill', 'black');
        bgMask.append(bgMaskG);
        this.bgMask = bgMaskG;
        this.bgMaskGroup = new ReplacableGroup(bgMaskG);

        // drop shadow around the shape
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shadow.setAttribute('mask', 'url(#scoreOverlay-mask');
        shadow.setAttribute('x', '-1000');
        shadow.setAttribute('y', '-1000');
        shadow.setAttribute('width', '2000');
        shadow.setAttribute('height', '2000');
        shadow.setAttribute('fill', 'black');
        this.element.appendChild(shadow);

        const shadowMask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        shadowMask.setAttribute('id', 'scoreOverlay-mask');
        this.element.append(shadowMask);

        const shadowMaskG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        shadowMaskG.setAttribute('filter', 'drop-shadow(0px 0px 10px white)');
        shadowMaskG.setAttribute('fill', 'black');
        shadowMaskG.setAttribute('stroke', 'black');
        shadowMaskG.setAttribute('stroke-width', '10px');
        shadowMask.append(shadowMaskG);
        this.shadowMask = shadowMaskG;
        this.shadowMaskGroup = new ReplacableGroup(shadowMaskG);

        // white outline around the shape
        const outlineBG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        outlineBG.setAttribute('stroke', BGCOLOR);
        outlineBG.setAttribute('stroke-width', '10px');
        outlineBG.setAttribute('fill', 'transparent');
        this.element.append(outlineBG);
        this.outlineBG = outlineBG;
        this.outlineBGGroup = new ReplacableGroup(outlineBG);

        // green outline around the shape
        const outlineFG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        outlineFG.setAttribute('stroke', Color.main);
        outlineFG.setAttribute('stroke-width', '5px');
        outlineFG.setAttribute('fill', 'transparent');
        this.element.append(outlineFG);
        this.outlineFG = outlineFG;
        this.outlineFGGroup = new ReplacableGroup(outlineFG);
    }

    showScores(shapes : Shape[]) {
        const bgMaskGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const shadowMaskGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const outlineBGGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const outlineFGGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        for (const shape of shapes) {
            const boundary : Vertex[] = this.computeOutline(shape);
            const pathComponents = (boundary.reverse().map((v) => `${v.x * SCALE},${v.y * SCALE}`));
            const roundPathString = roundPathCorners('M ' + pathComponents.join(' L ') + ' Z', 10, false);

            for (const group of [bgMaskGroup, shadowMaskGroup, outlineBGGroup, outlineFGGroup]) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', roundPathString);
                group.appendChild(path);
            }
        }

        this.bgMaskGroup.contents = [bgMaskGroup];
        this.shadowMaskGroup.contents = [shadowMaskGroup];
        this.outlineBGGroup.contents = [outlineBGGroup];
        this.outlineFGGroup.contents = [outlineFGGroup];
    }
}


class ReplacableGroup {
    parentNode : SVGElement;
    group : SVGElement;

    constructor(parentNode : SVGElement) {
        this.parentNode = parentNode;
    }

    set contents(elements : SVGElement[]) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
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