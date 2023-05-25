import type { Interactable, DragEvent } from '@interactjs/types';
import interact from '@interactjs/interact/index';


import { OrientedColors, Tile } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { dist, shuffle } from '../utils.js';
import { GameDisplay } from './GameDisplay.js';
import { DraggableTileHTMLDivElement } from './TileStackDisplay.js';
import { TriangleOnScreenMatch } from './TileDisplay.js';
import { TileDragSource } from './TileDragController.js';



export class MainGridDisplay extends GridDisplay {
    gameDisplay : GameDisplay;
    scoreOverlayDisplay : ScoreOverlayDisplay;
    ignorePlaceholders : boolean;
    container : HTMLElement;

    constructor(grid: Grid, container : HTMLElement, gameDisplay : GameDisplay) {
        super(grid);
        this.container = container;
        this.gameDisplay = gameDisplay;

        this.scoreOverlayDisplay = new ScoreOverlayDisplay_Cutout();
        this.svgGrid.appendChild(this.scoreOverlayDisplay.element);
        this.ignorePlaceholders = false;
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

    dropTile(source : TileDragSource, closestPair : TriangleOnScreenMatch) : boolean {
        const targetTile = closestPair.fixed.triangle.tile;
        if (targetTile && targetTile.isPlaceholder()) {
            return this.gameDisplay.game.placeTile(source.tile, source.rotation, closestPair.moving.triangle, closestPair.fixed.triangle, source.indexOnStack);
        }
        return false;
    }

    makeDroppable(ondrop: (target: Tile, orientedColors: OrientedColors, indexOnStack: number) => boolean) {
        interact(this.container).dropzone({}).on('dragenter', (evt: DragEvent) => {
            console.log('NEW dragenter', evt.target);
            const rel = (evt.relatedTarget as DraggableTileHTMLDivElement);

            const pos = rel.tileDisplay.getTriangleOnScreenPosition();
            console.log('clientCenterCoord', pos);

            const closestPair = this.findClosestTriangleFromScreenPosition(pos);
            console.log('closestPair', closestPair);
            if (closestPair) {
                console.log('closestPair',
                            'moving',
                            closestPair.moving.triangle.x,
                            closestPair.moving.triangle.y,
                            'fixed',
                            closestPair.fixed.triangle.x,
                            closestPair.fixed.triangle.y);
            }
        });


        /*
        for (const tileDisplay of this.tileDisplays) {
            if (tileDisplay.tile.isPlaceholder()) {
                tileDisplay.makeDropzone(this.gameDisplay, (evt : DragEvent, target: Tile, orientedColors: OrientedColors, indexOnStack: number) => {
                    if (ondrop(target, orientedColors, indexOnStack)) {
                        this.makeDroppable(ondrop);
                        evt.relatedTarget.classList.add('drag-success');
                    }
                });
            } else {
                tileDisplay.removeDropzone();
            }
        }
        */
    }

    gameFinished() {
        const placeholders = this.tileDisplays.filter((d) => d.tile.isPlaceholder());
        shuffle(placeholders);
        let delay = 100;
        const cleanUp = () => {
            if (placeholders.length > 0) {
                placeholders.pop().hide();
                delay = Math.max(20, delay * 0.9);
                window.setTimeout(cleanUp, placeholders.length > 0 ? delay : 100);
            } else {
                this.ignorePlaceholders = true;
                this.rescaleGrid();
            }
        };
        window.setTimeout(cleanUp, delay);
    }
}
