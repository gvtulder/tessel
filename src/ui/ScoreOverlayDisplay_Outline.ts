import { Shape } from "src/grid/Scorer.js";
import { roundPathCorners } from '../lib/svg-rounded-corners.js';
import { BGCOLOR, SCALE } from "src/settings.js";
import { ScoreOverlayDisplay, Vertex, Color } from "./ScoreOverlayDisplay.js";

export class ScoreOverlayDisplay_Outline extends ScoreOverlayDisplay {
    fg : SVGElement;
    group : SVGElement;
    mask : SVGElement;
    maskPathGroup : SVGElement;

    build() {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-scoreOverlay-mask disabled')
        this.element.append(group);

        const overlayFill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        overlayFill.setAttribute('class', 'svg-scoreOverlay-fill');
        overlayFill.setAttribute('x', '-1000');
        overlayFill.setAttribute('y', '-1000');
        overlayFill.setAttribute('width', '10000');
        overlayFill.setAttribute('height', '10000');
        overlayFill.setAttribute('fill', BGCOLOR);
        overlayFill.setAttribute('mask', 'url(#scoreoverlaymask)');
        group.appendChild(overlayFill);

        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', 'scoreoverlaymask');
        group.appendChild(mask);

        const maskWhite = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        maskWhite.setAttribute('class', 'svg-scoreOverlay-fill');
        maskWhite.setAttribute('x', '-1000');
        maskWhite.setAttribute('y', '-1000');
        maskWhite.setAttribute('width', '10000');
        maskWhite.setAttribute('height', '10000');
        maskWhite.setAttribute('fill', 'white');
        mask.appendChild(maskWhite);

        this.mask = mask;

        const fg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.append(fg);
        this.fg = fg;
    }

    showScores(shapes : Shape[]) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const maskPathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        for (const shape of shapes) {
            const boundary : Vertex[] = this.computeOutline(shape);

            const pathString = 'M ' + (boundary.reverse().map((v) => `${v.x * SCALE},${v.y * SCALE}`)).join(' ') + ' Z';
            console.log(pathString);

            // outline
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathString);
            path.setAttribute('fill', 'transparent');
            path.setAttribute('stroke', Color.main);
            path.setAttribute('stroke-width', '20');
            path.setAttribute('stroke-linecap', 'round');
            group.appendChild(path);

            // add mask
            const maskPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            maskPath.setAttribute('d', pathString);
            maskPath.setAttribute('fill', 'black');
            maskPathGroup.appendChild(maskPath);

            // animate path
            const pathComponents = (boundary.reverse().map((v) => `${v.x * SCALE},${v.y * SCALE}`));
            const curPath = [pathComponents.pop()];
            path.setAttribute('d', '');
            const interval = window.setInterval(() => {
                let finished = false;
                if (pathComponents.length == 0) {
                    window.clearInterval(interval);
                    finished = true;
                } else {
                    curPath.push(pathComponents.pop());
                }
                const roundPath = roundPathCorners('M ' + curPath.join(' L ') + (finished ? ' Z' : ''), 10, false);
                console.log(roundPath);
                path.setAttribute('d', roundPath);
            }, 50);
        }

        if (this.maskPathGroup) {
            this.mask.removeChild(this.maskPathGroup);
        }
        this.mask.appendChild(maskPathGroup);
        this.maskPathGroup = maskPathGroup;
        this.mask.classList.remove('disabled');
        this.mask.classList.add('enabled');
        this.mask.addEventListener('animationend', () => {
            this.mask.classList.replace('enabled', 'disabled');
        });

        if (this.group) {
            this.fg.removeChild(this.group);
        }
        this.fg.appendChild(group);
        this.group = group;
    }
}
