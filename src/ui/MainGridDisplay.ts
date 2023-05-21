import { OrientedColors, Tile } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";



export class MainGridDisplay extends GridDisplay {
    scoreOverlayDisplay : ScoreOverlayDisplay;

    constructor(grid: Grid) {
        super(grid);

        this.scoreOverlayDisplay = new ScoreOverlayDisplay_Cutout();
        this.svgGrid.appendChild(this.scoreOverlayDisplay.element);
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
        const availWidth = document.documentElement.clientWidth - this.margins.left - this.margins.right;
        const availHeight = document.documentElement.clientHeight - this.margins.top - this.margins.bottom;
        let totalWidth = SCALE * (this.width - this.left);
        let totalHeight = SCALE * (this.height - this.top);

        /* TODO
        const skipPlaceholders = 0;
        if (this.isGameFinished()) {
            totalWidth -= 200;
            totalHeight -= 200;
            skipPlaceholders = 1;
        }
        */
        const scale = Math.min(availWidth / totalWidth, availHeight / totalHeight);
        totalWidth *= scale;
        totalHeight *= scale;

        this.element.style.transform = `scale(${scale}`;
        this.element.style.left = `${this.margins.left + (availWidth - totalWidth) / 2 - (this.left * SCALE * scale)}px`;
        this.element.style.top = `${this.margins.top + (availHeight - totalHeight) / 2 - (this.top * SCALE * scale)}px`;

        this.scale = scale;

        this.element.classList.add('animated');
    }

    makeDroppable(ondrop: (target: Tile, orientedColors: OrientedColors, indexOnStack: number) => boolean) {
        for (const tileDisplay of this.tileDisplays) {
            if (tileDisplay.tile.isPlaceholder()) {
                tileDisplay.makeDropzone((target: Tile, orientedColors: OrientedColors, indexOnStack: number) => {
                    if (ondrop(target, orientedColors, indexOnStack)) {
                        this.makeDroppable(ondrop);
                    }
                });
            } else {
                tileDisplay.removeDropzone();
            }
        }
    }
}
