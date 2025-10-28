/**
 * SPDX-License-Identifier: GPL-3.0-or-later
 * SPDX-FileCopyrightText: Copyright (C) 2025 Gijs van Tulder
 */

import { describe, expect, test } from "@jest/globals";
import { Atlas, AtlasDefinitionDoc } from "./Atlas";
import { HexagonsAtlas } from "./atlas/HexagonsAtlas";
import { Penrose0Atlas } from "./atlas/Penrose0Atlas";
import { rad2deg } from "../geom/math";
import { Grid, SortedCorners } from "./Grid";
import { SnubSquareSourceGrid } from "./source/SnubSquareSourceGrid";

function toFixed(xs: readonly number[], fractionDigits: number) {
    return xs.map((x) => x.toFixed(fractionDigits));
}

describe("Atlas", () => {
    const squaresDef = {
        name: "Squares",
        shapes: {
            S: { name: "square", angles: [90, 90, 90, 90] },
        },
        vertices: [{ vertex: "S0-S0-S0-S0" }],
    };

    const trianglesDef = {
        name: "Triangles",
        shapes: {
            T: { name: "triangle", angles: [60, 60, 60] },
        },
        vertices: [{ vertex: "T0-T0-T0-T0-T0-T0" }],
    };

    test("can be created from a definition", () => {
        const def: AtlasDefinitionDoc = {
            name: "Square",
            shapes: {
                S: { name: "square", angles: [90, 90, 90, 90] },
            },
            vertices: [{ name: "square", vertex: "S0-S0-S0-S0" }],
        };
        const atlas = Atlas.fromDefinition(def);
        expect(atlas.patterns.length).toBe(1);
        expect(atlas.patterns[0].definition.length).toBe(4);
        const shape = atlas.patterns[0].definition[0].shape;
        expect(atlas.patterns[0].definition[1].shape).toBe(shape);
        expect(atlas.patterns[0].definition[2].shape).toBe(shape);
        expect(atlas.patterns[0].definition[3].shape).toBe(shape);
    });

    test("can be created from a SourceGrid", () => {
        const sourceGrid = SnubSquareSourceGrid;
        const atlas = Atlas.fromSourceGrid("snub-square", "", sourceGrid);
        expect(atlas.name).toBe("snub-square");
        expect(atlas.shapes.length).toBe(2);
        expect(atlas.shapes).toStrictEqual(sourceGrid.shapes);
    });

    test("checks for valid definitions", () => {
        expect(() => {
            Atlas.fromDefinition({
                name: "Duplicate shapes",
                shapes: {
                    A: { name: "square", angles: [90, 90, 90, 90] },
                    B: { name: "square", angles: [90, 90, 90, 90] },
                },
                vertices: [{ name: "square", vertex: "A0-B0-A0-B0" }],
            });
        }).toThrow();

        expect(() => {
            Atlas.fromDefinition({
                name: "Unknown shape",
                shapes: {
                    S: { name: "square", angles: [90, 90, 90, 90] },
                },
                vertices: [{ name: "square", vertex: "S0-X0-S0-S0" }],
            });
        }).toThrow();

        expect(() => {
            Atlas.fromDefinition({
                name: "Invalid component",
                shapes: {
                    S: { name: "square", angles: [90, 90, 90, 90] },
                },
                vertices: [{ name: "square", vertex: "abc-S0-S0-S0" }],
            });
        }).toThrow();

        expect(() => {
            Atlas.fromDefinition({
                name: "Empty",
                shapes: {
                    S: { name: "square", angles: [90, 90, 90, 90] },
                },
                vertices: [],
            });
        }).toThrow();
    });

    test("can compute rotation angles", () => {
        const squares = Atlas.fromDefinition(squaresDef);
        expect(rad2deg(squares.orientations)).toStrictEqual([0, 90, 180, 270]);

        const triangles = Atlas.fromDefinition(trianglesDef);
        expect(rad2deg(triangles.orientations)).toStrictEqual([
            0, 60, 120, 180, 240, 300,
        ]);

        const penrose = Penrose0Atlas;
        expect(rad2deg(penrose.orientations)).toStrictEqual([
            0, 36, 72, 108, 144, 180, 216, 252, 288, 324,
        ]);

        const hexagons = HexagonsAtlas;
        expect(rad2deg(hexagons.orientations)).toStrictEqual([
            0, 60, 120, 180, 240, 300,
        ]);
    });

    test("can check for matching vertex with squares", () => {
        const squares = Atlas.fromDefinition(squaresDef);
        const grid = new Grid(squares);
        const shape = squares.shapes[0];

        // empty vertex
        expect(squares.checkMatch(new SortedCorners())).toBe(true);

        const tile1 = grid.addTile(shape, shape.constructPolygonXYR(0, 0, 1));
        expect(tile1.vertices[0].corners.length).toBe(1);
        expect(squares.checkMatch(tile1.vertices[0].corners)).toBe(true);
        const tile2 = grid.addTile(
            shape,
            shape.constructPolygonEdge(tile1.polygon.outsideEdges[3], 0),
        );
        expect(tile1.vertices[0].corners.length).toBe(2);
        expect(squares.checkMatch(tile1.vertices[0].corners)).toBe(true);
        const tile3 = grid.addTile(
            shape,
            shape.constructPolygonEdge(tile2.polygon.outsideEdges[3], 0),
        );
        expect(tile1.vertices[0].corners.length).toBe(3);
        expect(squares.checkMatch(tile1.vertices[0].corners)).toBe(true);
        const tile4 = grid.addTile(
            shape,
            shape.constructPolygonEdge(tile3.polygon.outsideEdges[3], 0),
        );
        expect(tile1.vertices[0].corners.length).toBe(4);
        expect(squares.checkMatch(tile1.vertices[0].corners)).toBe(true);
    });

    test("can check for matching vertex with triangles", () => {
        const triangles = Atlas.fromDefinition(trianglesDef);
        const grid = new Grid(triangles);
        const shape = triangles.shapes[0];

        // empty vertex
        expect(triangles.checkMatch(new SortedCorners())).toBe(true);

        const tiles = [grid.addTile(shape, shape.constructPolygonXYR(0, 0, 1))];
        const vertex = tiles[0].vertices[0];
        expect(vertex.corners.length).toBe(1);
        expect(triangles.checkMatch(vertex.corners)).toBe(true);
        for (let i = 1; i < 6; i++) {
            tiles.push(
                grid.addTile(
                    shape,
                    shape.constructPolygonEdge(
                        tiles[i - 1].polygon.outsideEdges[2],
                        0,
                    ),
                ),
            );
            expect(vertex.corners.length).toBe(tiles.length);
            expect(triangles.checkMatch(vertex.corners)).toBe(true);
        }

        grid.removeTile(tiles[2]);
        expect(vertex.corners.length).toBe(5);
        expect(triangles.checkMatch(vertex.corners)).toBe(true);

        grid.removeTile(tiles[3]);
        expect(vertex.corners.length).toBe(4);
        expect(triangles.checkMatch(vertex.corners)).toBe(true);
    });
});
