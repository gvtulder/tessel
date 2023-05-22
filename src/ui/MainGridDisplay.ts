import type { DragEvent } from '@interactjs/types';

import { OrientedColors, Tile } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { shuffle } from '../utils.js';



export class MainGridDisplay extends GridDisplay {
    scoreOverlayDisplay : ScoreOverlayDisplay;
    ignorePlaceholders : boolean;

    constructor(grid: Grid) {
        super(grid);

        this.scoreOverlayDisplay = new ScoreOverlayDisplay_Cutout();
        this.svgGrid.appendChild(this.scoreOverlayDisplay.element);
        this.ignorePlaceholders = false;
    }

    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.zIndex = '1000';
    }

    enableAutoRescale() {
        this.autorescale = true;
        window.addEventListener('resize', () => {
            this.rescaleGrid();
        });
        this.rescaleGrid();
    }

    rescaleGrid() {
        let left = this.left;
        let top = this.top
        let width = this.width;
        let height = this.height;
        if (this.ignorePlaceholders) {
            left = this.leftNoPlaceholders;
            top = this.topNoPlaceholders
            width = this.widthNoPlaceholders;
            height = this.heightNoPlaceholders;
        }

        let availWidth = document.documentElement.clientWidth - this.margins.left - this.margins.right;
        let availHeight = document.documentElement.clientHeight - this.margins.top - this.margins.bottom;

        if (document.body.classList.contains('horizontal-controls')) {
            availHeight -= 120;
        } else {
            availWidth -= 120;
        }

        let totalWidth = SCALE * (width - left);
        let totalHeight = SCALE * (height - top);

        const scale = Math.min(availWidth / totalWidth, availHeight / totalHeight);
        totalWidth *= scale;
        totalHeight *= scale;

        this.element.style.transform = `scale(${scale}`;
        this.element.style.left = `${this.margins.left + (availWidth - totalWidth) / 2 - (left * SCALE * scale)}px`;
        this.element.style.top = `${this.margins.top + (availHeight - totalHeight) / 2 - (top * SCALE * scale)}px`;

        this.scale = scale;

        this.element.classList.add('animated');
    }

    makeDroppable(ondrop: (target: Tile, orientedColors: OrientedColors, indexOnStack: number) => boolean) {
        for (const tileDisplay of this.tileDisplays) {
            if (tileDisplay.tile.isPlaceholder()) {
                tileDisplay.makeDropzone((evt : DragEvent, target: Tile, orientedColors: OrientedColors, indexOnStack: number) => {
                    if (ondrop(target, orientedColors, indexOnStack)) {
                        this.makeDroppable(ondrop);
                        evt.relatedTarget.classList.add('drag-success');
                    }
                });
            } else {
                tileDisplay.removeDropzone();
            }
        }
    }

    gameFinished() {
        const placeholders = this.tileDisplays.filter((d) => d.tile.isPlaceholder());
        shuffle(placeholders);
        const interval = window.setInterval(() => {
            if (placeholders.length > 0) {
                placeholders.pop().hide();
            } else {
                window.clearInterval(interval);
                this.ignorePlaceholders = true;
                this.rescaleGrid();
            }
        }, 100);
        return;
    }
}
