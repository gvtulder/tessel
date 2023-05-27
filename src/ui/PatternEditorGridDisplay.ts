import type { DragEvent } from '@interactjs/types';

import { OrientedColors, Tile } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { shuffle } from '../utils.js';
import { GameDisplay } from './GameDisplay.js';



// TODO merge with MainGridDisplay

export class PatternEditorGridDisplay extends GridDisplay {
    container : HTMLElement;

    constructor(grid: Grid, container : HTMLElement) {
        super(grid);
        this.container = container;
    }

    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
    }

    rescale() {
        let left = this.left;
        let top = this.top
        let width = this.width;
        let height = this.height;

        left = this.leftNoPlaceholders;
        top = this.topNoPlaceholders
        width = this.widthNoPlaceholders;
        height = this.heightNoPlaceholders;

        // leave some space around
        const extraWidth = (width - left) / 4;
        const extraHeight = (height - top) / 4;
        left = left - extraWidth;
        top = top - extraHeight;
        width = width + 2 * extraWidth;
        height = height + 2 * extraHeight;

        const availWidth = (this.container || document.documentElement).clientWidth - this.margins.left - this.margins.right;
        const availHeight = (this.container || document.documentElement).clientHeight - this.margins.top - this.margins.bottom;

        let totalWidth = SCALE * (width - left);
        let totalHeight = SCALE * (height - top);

        const scale = Math.min(availWidth / totalWidth, availHeight / totalHeight);
        totalWidth *= scale;
        totalHeight *= scale;

        this.element.style.transform = `scale(${scale})`;
        this.element.style.left = `${this.margins.left + (availWidth - totalWidth) / 2 - (left * SCALE * scale)}px`;
        this.element.style.top = `${this.margins.top + (availHeight - totalHeight) / 2 - (top * SCALE * scale)}px`;

        this.scale = scale;

        if (!this.element.classList.contains('animated')) {
            window.setTimeout(() => {
                this.element.classList.add('animated');
            }, 1000);
        }
    }
}
