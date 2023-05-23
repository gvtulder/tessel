import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';

import { OrientedColors, Tile } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { shuffle } from '../utils.js';
import { GameDisplay } from './GameDisplay.js';
import { TileEditorDisplay } from './TileEditorDisplay.js';



// TODO merge with MainGridDisplay and PatternEditorGridDisplay

export class TileEditorGridEvent extends Event {
    x : number;
    y : number;
    constructor(type : string, x : number, y : number) {
        super(type);
        this.x = x;
        this.y = y;
    }
}

export class TileEditorGridDisplay extends GridDisplay {
    container : HTMLElement;

    constructor(grid: Grid, container : HTMLElement) {
        super(grid);
        this.container = container;

        interact(this.svgTriangles).on('tap', (evt : Event) => {
            const tgt = evt.target as SVGElement;
            if (tgt.getAttribute) {
                const x = tgt.getAttribute('data-x');
                const y = tgt.getAttribute('data-y');
                if (x !== undefined && x !== null) {
                    this.dispatchEvent(new TileEditorGridEvent('clicktriangle', parseInt(x), parseInt(y));
                }
            }
        })
        this.element.removeChild(this.tileElement);
    }

    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
    }

    enableAutoRescale() {
        this.autorescale = true;
        window.addEventListener('resize', () => {
            this.rescaleGrid();
        });
        this.rescaleGrid();
    }

    rescaleGrid() {
        const left = this.left;
        const top = this.top
        const width = this.width;
        const height = this.height;

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
