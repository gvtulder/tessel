import { describe, expect, test } from "@jest/globals";
import { Atlas, AtlasDefinitionDoc, Penrose0Atlas } from "./Atlas";
import { deg2rad, rad2deg } from "./math";

function toFixed(xs: readonly number[], fractionDigits: number) {
    return xs.map((x) => x.toFixed(fractionDigits));
}

describe("Atlas", () => {
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
        }).toThrowError();

        expect(() => {
            Atlas.fromDefinition({
                name: "Unknown shape",
                shapes: {
                    S: { name: "square", angles: [90, 90, 90, 90] },
                },
                vertices: [{ name: "square", vertex: "S0-X0-S0-S0" }],
            });
        }).toThrowError();

        expect(() => {
            Atlas.fromDefinition({
                name: "Invalid component",
                shapes: {
                    S: { name: "square", angles: [90, 90, 90, 90] },
                },
                vertices: [{ name: "square", vertex: "abc-S0-S0-S0" }],
            });
        }).toThrowError();

        expect(() => {
            Atlas.fromDefinition({
                name: "Empty",
                shapes: {
                    S: { name: "square", angles: [90, 90, 90, 90] },
                },
                vertices: [],
            });
        }).toThrowError();
    });

    test("can compute rotation angles", () => {
        const squares = Atlas.fromDefinition({
            name: "Squares",
            shapes: {
                S: { name: "square", angles: [90, 90, 90, 90] },
            },
            vertices: [{ vertex: "S0-S0-S0-S0" }],
        });
        expect(toFixed(squares.orientations, 4)).toStrictEqual(
            toFixed(deg2rad([0, 90, 180, 270]), 4),
        );

        const triangles = Atlas.fromDefinition({
            name: "Triangles",
            shapes: {
                T: { name: "triangle", angles: [60, 60, 60] },
            },
            vertices: [{ vertex: "T0-T0-T0" }],
        });
        expect(toFixed(triangles.orientations, 4)).toStrictEqual(
            toFixed(deg2rad([0, 60, 120, 180, 240, 300]), 4),
        );

        const penrose = Penrose0Atlas;
        expect(rad2deg(penrose.orientations)).toStrictEqual([
            0, 36, 72, 108, 144, 180, 216, 252, 288, 324,
        ]);
    });
});
