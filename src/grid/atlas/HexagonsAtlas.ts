import { Atlas } from "../Atlas";

export const HexagonsAtlas = Atlas.fromDefinition({
    name: "Hexagon",
    shapes: {
        H: { name: "hexagon", angles: [120, 120, 120, 120, 120, 120] },
    },
});
