/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { Grid } from "./Grid";
import { Tile } from "./Tile";
import { SquaresAtlas } from "./atlas/SquaresAtlas";

export const _ = null;
export type MockGridDefinition = (number | null)[][];

export class MockGridBuilder {
    static parseGridDefinition(def: MockGridDefinition): MockGridBuilder {
        const shape = SquaresAtlas.shapes[0];
        const grid = new Grid(SquaresAtlas);
        const tiles = new Map<string, Tile>();
        const queue: [number, number][] = [];

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
                if (dir.r < 0 || dir.r >= def.length) continue;
                if (dir.c < 0 || dir.c >= def[dir.r].length) continue;
                if (def[dir.r][dir.c] === null) continue;
                if (tiles.has(C(dir.r, dir.c))) continue;
                // create new tile
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

    private originGrid: Grid;
    tileSequence: Tile[][];
    grid: Grid;

    constructor(originGrid: Grid, tileSequence: Tile[][]) {
        this.originGrid = originGrid;
        this.tileSequence = tileSequence;
        this.grid = new Grid(originGrid.atlas);
    }

    applyStep(step: number): Tile[] {
        const tiles: Tile[] = [];
        if (this.tileSequence[step]) {
            for (const t of this.tileSequence[step]) {
                tiles.push(
                    this.grid.addTile(t.shape, t.polygon, t.polygon.segment()),
                );
            }
        }
        return tiles;
    }

    get numberOfSteps(): number {
        return this.tileSequence.length;
    }
}
