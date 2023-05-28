import { Pattern } from "./Pattern.js";
import { TileShape } from "./Tile.js";
import { TriangleType } from "./Triangle.js";

export class EditablePattern extends Pattern {
    /**
     * Initializes a new pattern.
     *
     * @param triangleType the triangle / grid type
     * @param shapes a definition of the tiles in this pattern
     */
    constructor(triangleType : TriangleType, shapes? : TileShape[]) {
        super(triangleType, [[[[0, 0]]]]);
    }

    /**
     * Updates the pattern.
     *
     * @param shapes the new pattern
     */
    updatePattern(shapes : TileShape[]) {
        this.shapes = shapes;
        this.numColorGroups = shapes[0].length;
        this.computeProperties();
    }
}
