import { Grid } from "../../grid/Grid";
import { shuffle } from "../../geom/RandomSampler";
import { GameDisplay } from "./GameDisplay";
import { GridDisplay } from "../grid/GridDisplay";
import { ScoreOverlayDisplay } from "../score/ScoreOverlayDisplay";
import { ScoreOverlayDisplay_Cutout } from "../score/ScoreOverlayDisplay_Cutout";
import { TileDragSource, TileDropTarget } from "../grid/TileDragController";
import { TileType } from "../../grid/Tile";
import { TileOnScreenMatch } from "../grid/TileDisplay";

export class MainGridDisplay extends GridDisplay implements TileDropTarget {
    gameDisplay: GameDisplay;
    scoreOverlayDisplay: ScoreOverlayDisplay;
    ignorePlaceholders: boolean;

    constructor(grid: Grid, container: HTMLElement, gameDisplay: GameDisplay) {
        super(grid, container);
        this.gameDisplay = gameDisplay;

        this.scoreOverlayDisplay = new ScoreOverlayDisplay_Cutout();
        this.svgGrid.appendChild(this.scoreOverlayDisplay.element);
        this.ignorePlaceholders = false;
    }

    protected computeDimensionsForRescale() {
        if (this.ignorePlaceholders) {
            return this.grid.bboxWithoutPlaceholders;
        } else {
            return this.grid.bbox;
        }
    }

    dropTile(source: TileDragSource, pair: TileOnScreenMatch): boolean {
        if (pair.fixed) {
            // && pair.fixed.tile && pair.fixed.tile.type === TileType.Placeholder) {
            //          const targetTile = pair.fixed.tile;
            //          if (targetTile && targetTile.type === TileType.Placeholder) {
            return this.gameDisplay.game.placeTile(
                pair.moving,
                pair.fixed,
                pair.offset,
                source.indexOnStack,
            );
            //          }
        }
        return false;
    }

    gameFinished() {
        const placeholders = [...this.tileDisplays.values()].filter(
            (d) => d.tile.tileType === TileType.Placeholder,
        );
        shuffle(placeholders);
        let delay = 100;
        const cleanUp = () => {
            const placeholder = placeholders.pop();
            if (placeholder) {
                placeholder.hide();
                delay = Math.max(20, delay * 0.9);
                window.setTimeout(
                    cleanUp,
                    placeholders.length > 0 ? delay : 100,
                );
            } else {
                this.ignorePlaceholders = true;
                this.triggerRescale();
            }
        };
        window.setTimeout(cleanUp, delay);
    }

    destroy() {
        super.destroy();
        this.scoreOverlayDisplay.destroy();
    }
}
