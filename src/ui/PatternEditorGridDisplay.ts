import type { DragEvent } from '@interactjs/types';

import { Tile, TileType } from "../grid/Tile.js";
import { SCALE } from 'src/settings.js';
import { GridDisplay } from './GridDisplay.js';
import { Grid } from "src/grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { shuffle } from '../utils.js';
import { GameDisplay } from './GameDisplay.js';
import { Coord, CoordId, Triangle } from 'src/grid/Triangle.js';
import { TileDragSource, TileDropTarget } from './TileDragController.js';
import { TileDisplay, TriangleOnScreenMatch } from './TileDisplay.js';
import { PatternEditorDisplay } from './PatternEditorDisplay.js';
import { TriangleDisplay } from './TriangleDisplay.js';



export class PatternEditorGridDisplay extends GridDisplay implements TileDropTarget {
    patternEditorDisplay : PatternEditorDisplay;

    backgroundFillPatternGrid : Grid;
    backgroundFillTileDisplays : TileDisplay[];

    svgBackgroundFillTriangles : SVGElement;

    constructor(patternEditorDisplay : PatternEditorDisplay, grid : Grid, container : HTMLElement) {
        super(grid, container);
        this.patternEditorDisplay = patternEditorDisplay;

        this.addBackgroundGrid();

        this.backgroundFillPatternGrid = new Grid(grid.triangleType, grid.pattern);
        this.backgroundFillTileDisplays = [];
        this.addBackgroundFillPattern();
    }

    addBackgroundFillPattern() {
        this.svgBackgroundFillTriangles = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgBackgroundFillTriangles.setAttribute('class', 'svg-tiles-editorBackgroundFillPattern');
        this.svgGrid.insertBefore(this.svgBackgroundFillTriangles, this.svgTriangles);
    }

    styleMainElement() {
        const div = this.element;
        div.className = 'gridDisplay';
    }

    dropTile(source : TileDragSource, pair : TriangleOnScreenMatch) : boolean {
        return this.patternEditorDisplay.dropTile(source, pair);
    }

    computeDimensionsForRescale() {
        let left : number = null;
        let top : number = null;
        let right : number = null;
        let bottom : number = null;
        for (const tile of this.grid.getTilesWithType(TileType.PatternEditorTile)) {
            if (left == null || tile.left < left) {
                left = tile.left;
            }
            if (right == null || tile.right > right) {
                right = tile.right;
            }
            if (top == null || tile.top < top) {
                top = tile.top;
            }
            if (bottom == null || tile.bottom > bottom) {
                bottom = tile.bottom;
            }
        }
        return {
            minX: left - 0.75 * (right - left),
            minY: top - 0.75 * (bottom - top),
            maxX: right + 0.75 * (right - left),
            maxY: bottom + 0.75 * (bottom - top),
        };
    }

    fillBackgroundPattern() {
        this.backgroundFillPatternGrid.removeAllTiles();
        for (const td of this.backgroundFillTileDisplays) {
            td.destroy();
        }

        // fill the screen by adding neighbors until the edge of the viewbox is reached
        const done = new Set<CoordId>();
        const queueXY : Coord[] = [];
        queueXY.push([0, 0]);
        done.add(CoordId(0, 0));
        let count = 0;
        let tooMany = 0;
        while (queueXY.length > 0) {
            const tileCoord = queueXY.shift();
            const tile = this.backgroundFillPatternGrid.getOrAddTile(tileCoord[0], tileCoord[1], TileType.PatternExample);
            // TODO colors
            // tile.colors = ...
            tile.colors = tile.colors.map((c) => 'red');
            count++;
            if (tile.left * SCALE < this.visibleRight &&
                tile.right * SCALE > this.visibleLeft &&
                tile.top * SCALE < this.visibleBottom &&
                tile.bottom * SCALE > this.visibleTop) {
                for (let offsetX=-1; offsetX<=1; offsetX++) {
                    for (let offsetY=-1; offsetY<=1; offsetY++) {
                        if (offsetX == 0 && offsetY == 0) continue;
                        const newTileCoordId = `${tileCoord[0] + offsetX} ${tileCoord[1] + offsetY}`;
                        if (!done.has(newTileCoordId) && done.size < 1000) {
                            queueXY.push([tileCoord[0] + offsetX, tileCoord[1] + offsetY]);
                            done.add(newTileCoordId);
                        }
                    }
                }
            } else {
                // outside screen
                this.backgroundFillPatternGrid.removeTile(tile);
                tooMany++;
            }
        }
        console.log(`Added ${count} background tiles, ${tooMany} outside the screen.`);





        const commonTriangleDisplays = { triangleDisplays: new Map<Triangle, TriangleDisplay>() };

        for (const tile of this.backgroundFillPatternGrid.tiles) {
            const td = new TileDisplay(commonTriangleDisplays, tile);
            this.backgroundFillTileDisplays.push(td);
            this.svgBackgroundFillTriangles.appendChild(td.svgTriangles);
        }
    }
}
