import type { DragEvent } from "@interactjs/types";

import { Tile, TileType } from "../grid/Tile.js";
import { SCALE } from "../settings.js";
import { GridDisplay } from "./GridDisplay.js";
import { Grid } from "../grid/Grid.js";
import { ScoreOverlayDisplay } from "./ScoreOverlayDisplay.js";
import { ScoreOverlayDisplay_Cutout } from "./ScoreOverlayDisplay_Cutout.js";
import { shuffle } from "../utils.js";
import { GameDisplay } from "./GameDisplay.js";
import { Coord, CoordId, Triangle } from "../grid/Triangle.js";
import { TileDragSource, TileDropTarget } from "./TileDragController.js";
import { TileDisplay, TriangleOnScreenMatch } from "./TileDisplay.js";
import { PatternEditorDisplay } from "./PatternEditorDisplay.js";
import { TriangleDisplay } from "./TriangleDisplay.js";

const BGCOLORS = ["red", "blue", "black", "orange", "green", "purple"];

export class PatternEditorGridDisplay
    extends GridDisplay
    implements TileDropTarget
{
    patternEditorDisplay: PatternEditorDisplay;

    backgroundFillPatternGrid: Grid;
    backgroundFillTileDisplays: TileDisplay[];

    svgBackgroundFillTriangles: SVGElement;

    constructor(
        patternEditorDisplay: PatternEditorDisplay,
        grid: Grid,
        container: HTMLElement,
    ) {
        super(grid, container);
        this.patternEditorDisplay = patternEditorDisplay;

        this.addBackgroundGrid();

        this.backgroundFillPatternGrid = new Grid(
            grid.triangleType,
            grid.pattern,
        );
        this.backgroundFillTileDisplays = [];
        this.addBackgroundFillPattern();
    }

    addBackgroundFillPattern() {
        this.svgBackgroundFillTriangles = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g",
        );
        this.svgBackgroundFillTriangles.setAttribute(
            "class",
            "svg-tiles-editorBackgroundFillPattern",
        );
        this.svgGrid.insertBefore(
            this.svgBackgroundFillTriangles,
            this.svgTiles,
        );
    }

    styleMainElement() {
        const div = this.element;
        div.className = "gridDisplay";
    }

    rescale() {
        super.rescale();
        this.fillBackgroundPattern();
    }

    dropTile(source: TileDragSource, pair: TriangleOnScreenMatch): boolean {
        return this.patternEditorDisplay.dropTile(source, pair);
    }

    computeDimensionsForRescale() {
        let left: number = null;
        let top: number = null;
        let right: number = null;
        let bottom: number = null;
        for (const tile of this.grid.getTilesWithType(
            TileType.PatternEditorTile,
        )) {
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
        return;

        /*

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



        // attempt a nice coloring
        const allTriangles : Triangle[] = [];
        for (const tile of this.backgroundFillPatternGrid.tiles) {
            for (const triangle of tile.triangles) {
                allTriangles.push(triangle);
            }
        }
        if (allTriangles.length == 0) return;
        const triangleMinX = Math.min(...allTriangles.map((t) => t.x));
        const triangleMaxX = Math.max(...allTriangles.map((t) => t.x));
        const width = triangleMaxX - triangleMinX + 1;
        const triangleMinY = Math.min(...allTriangles.map((t) => t.y));
        const triangleMaxY = Math.max(...allTriangles.map((t) => t.y));
        const height = triangleMaxY - triangleMinY + 1;

        // convert the triangle grid into an adjacency matrix
        const constraintBuffer = new ArrayBuffer(width * height * width * height);
        const constraints = new Int8Array(constraintBuffer);
        for (const triangle of allTriangles) {
            const tidx = (triangle.x - triangleMinX) + (triangle.y - triangleMinY) * width;
            for (const neighbor of triangle.getNeighbors()) {
                const nidx = (neighbor.x - triangleMinX) + (neighbor.y - triangleMinY) * width;
                if (neighbor.tile !== triangle.tile || neighbor.colorGroup === triangle.colorGroup) {
                    // must have the same color
                    constraints[tidx + nidx * width * height] = 1;
                    constraints[tidx * width * height + nidx] = 1;
                } else if (neighbor.tile === triangle.tile) {
                    // would be nice if they had a different color
                    constraints[tidx + nidx * width * height] = -1;
                    constraints[tidx * width * height + nidx] = -1;
                }
            }
        }
        for (const tile of this.backgroundFillPatternGrid.tiles) {
            for (const triangleA of tile.triangles) {
                const idxA = (triangleA.x - triangleMinX) + (triangleA.y - triangleMinY) * width;
                for (const triangleB of tile.triangles) {
                    const idxB = (triangleB.x - triangleMinX) + (triangleB.y - triangleMinY) * width;
                    if (triangleA.colorGroup === triangleB.colorGroup) {
                        // same color group in the same tile
                        constraints[idxA + idxB * width * height] = 1;
                        constraints[idxA * width * height + idxB] = 1;
                    }
                }
            }
        }
        console.log(constraints);

        // walk the grid to group neighboring tiles in clusters
        const clusterBuffer = new ArrayBuffer(width * height * 16);
        const clusters = new Uint16Array(clusterBuffer);
        const clusterAdjacencyBuffer = new ArrayBuffer(width * height * width * height);
        const clusterAdjacency = new Uint8Array(clusterAdjacencyBuffer);
        let clusterCount = 0;
        for (let i=0; i<width*height; i++) {
            if (clusters[i] === 0) {
                clusterCount++;
                // assign the same to all neighbors
                const queue : number[] = [i];
                while (queue.length > 0) {
                    const j = queue.shift();
                    clusters[j] = clusterCount;
                    for (let n=0; n<width*height; n++) {
                        if (constraints[n * width * height + j] === 1) {
                            // neighbor
                            if (clusters[n] === 0) {
                                clusters[n] = clusterCount;
                                queue.push(n);
                            } else {
                                clusterAdjacency[clusters[n] * width * height + clusters[j]] = 1;
                                clusterAdjacency[clusters[j] * width * height + clusters[n]] = 1;
                            }
                        } else if (constraints[n * width * height + j] !== 1) {
                            clusterAdjacency[clusters[n] * width * height + clusters[j]] = 1;
                            clusterAdjacency[clusters[j] * width * height + clusters[n]] = 1;
                        }
                    }
                }
            }
        }
        console.log(`Found ${clusterCount} connected regions.`);
        console.log(clusters);
        let sum2 = 0;
        for (let ca=0; ca<clusterCount; ca++) {
            for (let cb=0; cb<ca; cb++) {
                if (clusterAdjacency[ca * width * height + cb] === 1) {
                    sum2++;
                }
            }
        }
        console.log(`Found ${sum2} cluster adjacencies.`);
        let sum = 0;
        for (let i=0; i<width*height*width*height; i++) {
            if (clusterAdjacency[i] === 1) sum++;
        }
        console.log(`Found ${sum} cluster adjacencies.`);

        const colorBuffer = new ArrayBuffer(clusterCount);
        const colors = new Int8Array(colorBuffer);
        for (let c=0; c<clusterCount; c++) {
            // find adjacent clusters
            const adjacentColors : number[] = [];
            for (let ca=0; ca<c; ca++) {
                if (clusterAdjacency[ca * width * height + c] === 1) {
                    // this is an adjacent cluster
                    adjacentColors.push(colors[ca]);
                }
            }
            if (adjacentColors.length > 0 && Math.random() < 0.3) {
                // pick a neighbouring color
                colors[c] = adjacentColors[0];
            } else if (adjacentColors.length < BGCOLORS.length) {
                // pick a different color
                const newColors : number[] = [];
                for (let i=0; i<BGCOLORS.length; i++) {
                    if (adjacentColors.indexOf(i) === -1) {
                        newColors.push(i);
                    }
                }
                colors[c] = newColors[Math.floor(Math.random() * newColors.length)];
            } else {
                // pick a random color
                colors[c] = Math.floor(Math.random() * BGCOLORS.length);
            }
        }

        // assign colors to the clusters
        for (const triangle of allTriangles) {
            const tidx = (triangle.x - triangleMinX) + (triangle.y - triangleMinY) * width;
            triangle.color = BGCOLORS[colors[clusters[tidx]] % BGCOLORS.length];
        }


        const commonTriangleDisplays = { triangleDisplays: new Map<Triangle, TriangleDisplay>() };

        for (const tile of this.backgroundFillPatternGrid.tiles) {
            const td = new TileDisplay(commonTriangleDisplays, tile);
            this.backgroundFillTileDisplays.push(td);
            this.svgBackgroundFillTriangles.appendChild(td.svgTriangles);
        }

        */
    }
}
