import type { Interactable, DragEvent } from '@interactjs/types';
import interact from 'interactjs';

import { COLORS } from "../grid/EditableTile.js";
import { TriangleColor } from "../grid/Triangle.js";

export class ColorStackDisplay {
    colors : TriangleColor[];

    element : HTMLElement;
    interactable : Interactable;
    swatches : HTMLElement[];

    activeSwatchIndex : number;
    onchange : (color : TriangleColor) => void;

    constructor(onchange : (color : TriangleColor) => void) {
        this.onchange = onchange;
        this.colors = COLORS;
        this.build();

        this.interactable = interact(this.element);
        this.interactable.on('tap', (evt : PointerEvent) => {
            let tgt = evt.target as HTMLElement;
            while (tgt && tgt.parentNode && tgt.classList && !tgt.classList.contains('colorSwatch')) {
                tgt = tgt.parentNode as HTMLElement;
            }
            const swatchIdx = this.swatches.indexOf(tgt);
            if (swatchIdx !== -1) {
                this.activateSwatch(swatchIdx);
            }
        });

        this.activateSwatch(0);
    }

    destroy() {
        this.interactable.unset();
    }

    build() {
        const div = document.createElement('div');
        div.className = 'colorStackDisplay';
        this.element = div;

        this.swatches = [];

        for (const color of this.colors) {
            const colorElement = document.createElement('div');
            colorElement.className = 'colorSwatch';
            div.appendChild(colorElement);
            this.swatches.push(colorElement);

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'svg-colorSwatch');
            colorElement.appendChild(svg);

            const circleOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circleOuter.setAttribute('class', 'svg-colorSwatch-outer');
            circleOuter.setAttribute('fill', '#ddd');
            circleOuter.setAttribute('r', '45%');
            circleOuter.setAttribute('cx', '50%');
            circleOuter.setAttribute('cy', '50%');
            svg.appendChild(circleOuter);

            const circleInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circleInner.setAttribute('class', 'svg-colorSwatch-inner');
            circleInner.setAttribute('fill', color);
            circleInner.setAttribute('r', '30%');
            circleInner.setAttribute('cx', '50%');
            circleInner.setAttribute('cy', '50%');
            svg.appendChild(circleInner);
        }
    }

    activateSwatch(index : number) {
        for (let i=0; i<this.swatches.length; i++) {
            this.swatches[i].classList.toggle('active', index == i);
        }
        this.activeSwatchIndex = index;
        if (this.onchange) {
            this.onchange(this.activeColor);
        }
    }

    get activeColor() : TriangleColor {
        return this.colors[this.activeSwatchIndex];
    }
}
