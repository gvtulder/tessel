import { describe, expect, test } from "@jest/globals";
import { Atlas, AtlasDefinitionDoc } from "./Atlas";

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
});
