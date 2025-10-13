/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "./Grid";
import { Tile } from "./Tile";
import { SquaresAtlas } from "./atlas/SquaresAtlas";

/**
 * Shorthand for null in the grid defintions.
 */
export const _ = null;

/**
 * Defines a mock grid in a 2D array.
 *
 * For row r and column c:
 * - A number def[r][c] = t indicates a tile inserted at step t.
 * - def[r][c] = null (or _) indicates no tile at that position.
 */
export type MockGridDefinition = (number | null)[][];

/**
 * Simulates the construction of a tile grid given the definition.
 */
export class MockGridBuilder {
    /**
     * Returns a new MockGridBuilder that implements the given pattern.
     *
     * @param def the grid definition
     * @returns a new MockGridBuilder
     */
    static parseGridDefinition(def: MockGridDefinition): MockGridBuilder {
        const shape = SquaresAtlas.shapes[0];
        const grid = new Grid(SquaresAtlas);
        const tiles = new Map<string, Tile>();
        const queue: [number, number][] = [];

        // convert row, column coordinate to string
        const C = (i: number, j: number) => `${i.toFixed(2)} ${j.toFixed(2)}`;

        // find a starting tile
        for (let c = 0; queue.length == 0 && c < def[0].length; c++) {
            if (def[0][c] === 0) {
                queue.push([0, c]);
                tiles.set(C(0, c), grid.addInitialTile());
            }
        }

        // walk the grid
        const tileSequence: Tile[][] = [];
        while (queue.length > 0) {
            const [r, c] = queue.shift()!;
            const tile = tiles.get(C(r, c))!;

            // add tile to this step
            const step = def[r][c];
            if (step === null) continue;
            (tileSequence[step] ||= []).push(tile);

            // look up, down, left, right
            for (const dir of [
                { r: r - 1, c: c, edgeIndex: 0, otherEdgeIndex: 2 },
                { r: r + 1, c: c, edgeIndex: 2, otherEdgeIndex: 0 },
                { r: r, c: c - 1, edgeIndex: 1, otherEdgeIndex: 3 },
                { r: r, c: c + 1, edgeIndex: 3, otherEdgeIndex: 1 },
            ]) {
                // check that we are still inside the definition
                if (dir.r < 0 || dir.r >= def.length) continue;
                if (dir.c < 0 || dir.c >= def[dir.r].length) continue;
                if (def[dir.r][dir.c] === null) continue;
                // have we already processed this tile?
                if (tiles.has(C(dir.r, dir.c))) continue;

                // create new tile and add to the queue
                const poly = shape.constructPolygonEdge(
                    tile.polygon.outsideEdges[dir.edgeIndex],
                    dir.otherEdgeIndex,
                );
                const newTile = grid.addTile(shape, poly, poly.segment());
                tiles.set(C(dir.r, dir.c), newTile);
                queue.push([dir.r, dir.c]);
            }
        }

        return new MockGridBuilder(grid, tileSequence);
    }

    /**
     * The original grid with all tiles already inserted.
     */
    private originGrid: Grid;
    /**
     * The tiles in order of insertion.
     */
    tileSequence: Tile[][];
    /**
     * The mock grid.
     */
    grid: Grid;

    /**
     * Constructs a new MockGridBuilder.
     * @param originGrid the grid containing all tiles
     * @param tileSequence the tiles to be inserted in each step
     */
    constructor(originGrid: Grid, tileSequence: Tile[][]) {
        this.originGrid = originGrid;
        this.tileSequence = tileSequence;
        this.grid = new Grid(originGrid.atlas);
    }

    /**
     * Inserts the tiles for the given step into the mock grid.
     * @param step the step in the sequence
     * @returns the new tiles inserted in the grid
     */
    applyStep(step: number): Tile[] {
        return (this.tileSequence[step] || []).map((tile) =>
            this.grid.addTile(tile.shape, tile.polygon, tile.polygon.segment()),
        );
    }

    /**
     * The number of steps in the mock sequence.
     */
    get numberOfSteps(): number {
        return this.tileSequence.length;
    }
}
