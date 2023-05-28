

import { Grid } from "src/grid/Grid.js";
import { shuffle } from '../utils.js';
import { GameDisplay } from './GameDisplay.js';
import { GridDisplay } from './GridDisplay.js';
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { TriangleOnScreenMatch } from './TileDisplay.js';
import { TileDragSource } from './TileDragController.js';



export class MainGridDisplay extends GridDisplay {
    gameDisplay : GameDisplay;
    scoreOverlayDisplay : ScoreOverlayDisplay;
    ignorePlaceholders : boolean;

    constructor(grid: Grid, container : HTMLElement, gameDisplay : GameDisplay) {
        super(grid, container);
        this.gameDisplay = gameDisplay;

        this.scoreOverlayDisplay = new ScoreOverlayDisplay_Cutout();
        this.svgGrid.appendChild(this.scoreOverlayDisplay.element);
        this.ignorePlaceholders = false;
    }

    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
    }

    protected computeDimensionsForRescale() {
        if (this.ignorePlaceholders) {
            return {
                minX: this.contentMinXNoPlaceholders,
                minY: this.contentMinYNoPlaceholders,
                maxX: this.contentMaxXNoPlaceholders,
                maxY: this.contentMaxYNoPlaceholders,
            };
        } else {
            return {
                minX: this.contentMinX,
                minY: this.contentMinY,
                maxX: this.contentMaxX,
                maxY: this.contentMaxY,
            };
        }
    }

    dropTile(source : TileDragSource, pair : TriangleOnScreenMatch) : boolean {
        const targetTile = pair.fixed.tile;
        if (targetTile && targetTile.isPlaceholder()) {
            return this.gameDisplay.game.placeTile(source.tile, source.rotation, pair.moving, pair.fixed, source.indexOnStack);
        }
        return false;
    }

    gameFinished() {
        const placeholders = [...this.tileDisplays.values()].filter(
            (d) => d.tile.isPlaceholder()
        );
        shuffle(placeholders);
        let delay = 100;
        const cleanUp = () => {
            if (placeholders.length > 0) {
                placeholders.pop().hide();
                delay = Math.max(20, delay * 0.9);
                window.setTimeout(cleanUp, placeholders.length > 0 ? delay : 100);
            } else {
                this.ignorePlaceholders = true;
                this.triggerRescale();
            }
        };
        window.setTimeout(cleanUp, delay);
    }
}
