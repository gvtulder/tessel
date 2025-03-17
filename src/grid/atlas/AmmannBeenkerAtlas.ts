import { Atlas } from "../Atlas";

export const AmmannBeenkerAtlas = Atlas.fromDefinition({
    name: "Ammann-Beenker",
    shapes: {
        S: {
            name: "square",
            angles: [90, 90, 90, 90],
            frequency: 1,
            colorPatterns: [
                [[0, 1, 2, 3]],
                [
                    [0, 0, 1, 1],
                    [0, 1, 1, 0],
                ],
                [[0, 0, 0, 0]],
            ],
        },
        R: {
            name: "rhombus",
            angles: [45, 135, 45, 135],
            frequency: 1,
            colorPatterns: [
                [[0, 1, 2, 3]],
                [
                    [0, 0, 1, 1],
                    [0, 1, 1, 0],
                ],
                [[0, 0, 0, 0]],
            ],
        },
    },
});
