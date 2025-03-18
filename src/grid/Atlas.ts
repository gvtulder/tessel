import { CornerType, SortedCorners } from "./Grid";
import { deg2rad, RAD2DEG } from "../geom/math";
import { AngleUse, ColorPattern, Shape } from "./Shape";
import { UniqueNumberCycleSet } from "../geom/arrays";
import { SourceGridType } from "./SourceGrid";

/**
 * A short notation format for a shape.
 */
export type ShapeDefinitionDoc = {
    name?: string;
    angles: number[];
    sides?: number[];
    preferredAngles?: {
        [use: string]: number;
    };
    frequency?: number;
    colorPatterns?: number[][][];
};

/**
 * A short notation format for a vertex atlas, to be used in JSON documents etc.
 */
export type AtlasDefinitionDoc = {
    name?: string;
    shapes: {
        [key: string]: ShapeDefinitionDoc;
    };
    vertices?: {
        name?: string;
        vertex: string;
    }[];
};

/**
 * Internal representation of a vertex pattern.
 * This is an ordered list describing the corners around the vertex.
 */
type AtlasVertexDef = {
    /**
     * The shape of this corner.
     */
    shape: Shape;
    /**
     * The vertex index of the corner connected to this vertex.
     */
    vertexIndex: number;
    /**
     * The corner type as defined in the shape.
     */
    cornerType: CornerType;
    /**
     * The angle width of this corner.
     */
    cornerAngle: number;
}[];

const EPSILON = 1e-5;

/**
 * A pattern describing the corners around one vertex.
 */
class VertexPattern {
    definition: AtlasVertexDef;

    constructor(corners: { shape: Shape; vertexIndex: number }[]) {
        this.definition = corners.map((c) => ({
            shape: c.shape,
            vertexIndex: c.vertexIndex,
            cornerType: c.shape.cornerTypes[c.vertexIndex],
            cornerAngle: c.shape.cornerAngles[c.vertexIndex],
        }));
    }

    /**
     * Checks the vertex against this pattern.
     * @param corners the corner arrangement of this vertex
     * @returns true if the vertex matches
     */
    checkMatch(corners: SortedCorners): boolean {
        if (corners.length == 0) return true;
        const def = this.definition;
        // try each starting point on the vertex
        for (let start = 0; start < def.length; start++) {
            let curAngle = corners[0].edgeAngle;
            let defIdx = 0;
            let ok = true;
            for (let i = 0; i < corners.length; i++) {
                const corner = corners[i];
                // skip over unused corners
                while (
                    curAngle < corner.edgeAngle - EPSILON &&
                    defIdx < def.length
                ) {
                    curAngle += def[(defIdx + start) % def.length].cornerAngle;
                    defIdx++;
                }
                if (
                    defIdx >= def.length ||
                    Math.abs(curAngle - corner.edgeAngle) > EPSILON ||
                    corner.shape != def[(defIdx + start) % def.length].shape ||
                    corner.cornerType !=
                        def[(defIdx + start) % def.length].cornerType
                ) {
                    ok = false;
                    break;
                }
                curAngle += def[(defIdx + start) % def.length].cornerAngle;
                defIdx++;
            }
            if (ok) {
                return true;
            }
        }
        return false;
    }

    /**
     * Construct a new VertexPattern by parsing the string definition.
     * E.g.: S0-S0-S0-S0
     * @param vertexString a string defining the vertex sequence
     * @param shapes maps shape identifiers to Shape objects
     * @returns a new VertexPattern
     */
    static fromString(
        vertexString: string,
        shapes: Map<string, Shape>,
    ): VertexPattern {
        return new VertexPattern(
            vertexString.split("-").map((c) => {
                if (!c.match(/^[A-Za-z][0-9]$/)) {
                    throw new Error(`invalid component ${c} in atlas pattern`);
                }
                const s = c.charAt(0);
                const v = c.charAt(1);
                const shape = shapes.get(s);
                if (!shape) {
                    throw new Error(`undefined shape ${s} in atlas pattern`);
                }
                return {
                    shape: shape,
                    vertexIndex: parseInt(c.charAt(1)),
                };
            }),
        );
    }
}

/**
 * A 0-atlas that can check vertices for valid combinations.
 */
export class Atlas {
    /**
     * A user-friendly name for this atlas.
     */
    name: string;
    /**
     * The patterns recognized in this atlas.
     */
    patterns: readonly VertexPattern[];
    /**
     * All shapes in this atlas.
     */
    shapes: readonly Shape[];
    /**
     * How often the tiles appear in the tiling.
     * Normalized to have a minimum value of 1.
     */
    shapeFrequencies: ReadonlyMap<Shape, number>;
    /**
     * The source grid, if any.
     */
    sourceGrid?: SourceGridType;
    /**
     * The scale factor for the shapes in this factor.
     */
    scale: number;

    /**
     * Initializes the atlas with a number of patterns.
     * @param name a user-friendly name for this atlas
     * @param shapes the shapes in these patterns
     * @param patterns one or more patterns
     * @param shapeFrequencies of the shapes
     * @param sourceGrid
     */
    constructor(
        name: string,
        shapes: Shape[],
        patterns: VertexPattern[],
        shapeFrequencies?: ReadonlyMap<Shape, number>,
        sourceGrid?: SourceGridType,
    ) {
        this.name = name;
        this.patterns = patterns;
        this.shapes = shapes;
        this.sourceGrid = sourceGrid;

        // compute normalized frequencies
        const min = Math.min(
            ...shapes.map(
                (shape) =>
                    (shapeFrequencies && shapeFrequencies.get(shape)) || 1,
            ),
        );
        const normalizedFrequencies = new Map<Shape, number>();
        for (const shape of shapes) {
            normalizedFrequencies.set(
                shape,
                ((shapeFrequencies && shapeFrequencies.get(shape)) || 1) / min,
            );
        }
        this.shapeFrequencies = normalizedFrequencies;

        this.scale =
            1 /
            (2 *
                shapes[0].smallestCircleRadius *
                shapes[0].smallestCircleRadius);
    }

    /**
     * Checks the vertex against all patterns in this atlas.
     * @param corners the corner arrangement this vertex
     * @returns true if this is valid in this atlas
     */
    checkMatch(corners: SortedCorners): boolean {
        for (const pattern of this.patterns) {
            if (pattern.checkMatch(corners)) {
                return true;
            }
        }
        return false;
    }

    private _orientations: readonly number[] | undefined;

    /**
     * Computes the full set of rotation angles for tiles
     * in this atlas.
     */
    get orientations(): readonly number[] {
        if (this._orientations) return this._orientations;
        const angles = new Set<number>();
        angles.add(0);
        while (angles.size < 100) {
            const angleCountBefore = angles.size;
            for (const startAngle of [...angles]) {
                for (const shape of this.shapes) {
                    let angle = startAngle;
                    for (const a of shape.cornerAnglesDeg) {
                        angle = Math.round(angle) % 360;
                        angles.add(angle);
                        angles.add((angle + 180) % 360);
                        angle += a;
                    }
                }
                if (angles.size > 100) break;
            }
            if (angleCountBefore == angles.size) break;
        }
        return (this._orientations = deg2rad(
            [...angles].sort((a, b) => a - b),
        ));
    }

    /**
     * Construct a new atlas by parsing the definition.
     * @param definition a valid definition object
     * @returns a new atlas
     */
    static fromDefinition(definition: AtlasDefinitionDoc): Atlas {
        const shapes = new Map<string, Shape>();
        const shapeFrequencies = new Map<Shape, number>();
        for (const key in definition.shapes) {
            const d = definition.shapes[key];
            const shape = parseShapeDefinition(d);
            for (const s of shapes.values()) {
                if (shape.equalAngles(s)) {
                    throw new Error("duplicate shape in atlas pattern");
                }
            }
            shapes.set(key, shape);
            shapeFrequencies.set(shape, d.frequency || 1);
        }
        const vertexPatterns = new Array<VertexPattern>();
        if (definition.vertices) {
            for (const v of definition.vertices) {
                vertexPatterns.push(VertexPattern.fromString(v.vertex, shapes));
            }
        } else {
            vertexPatterns.push(...computeVertexPatterns([...shapes.values()]));
        }
        if (vertexPatterns.length < 1) {
            throw new Error("empty atlas pattern");
        }
        return new Atlas(
            definition.name || "",
            [...shapes.values()],
            vertexPatterns,
            shapeFrequencies,
        );
    }

    static fromSourceGrid(name: string, sourceGrid: SourceGridType): Atlas {
        const vertexPatterns = computeVertexPatterns([
            ...sourceGrid.shapes.values(),
        ]);
        return new Atlas(
            name,
            [...sourceGrid.shapes],
            vertexPatterns,
            sourceGrid.shapeFrequencies,
            sourceGrid,
        );
    }
}

/**
 * Parse the shape definition and return a new Shape.
 */
export function parseShapeDefinition(d: ShapeDefinitionDoc): Shape {
    const colorPatterns = parseColorPatterns(d.angles.length, d.colorPatterns);
    const preferredAngles = new Map<AngleUse, number>();
    if (d.preferredAngles) {
        for (const use in d.preferredAngles) {
            preferredAngles.set(use as AngleUse, d.preferredAngles[use]);
        }
    }
    const shape = new Shape(
        d.name || "",
        d.angles,
        d.sides,
        colorPatterns,
        preferredAngles,
    );
    return shape;
}

function parseColorPatterns(
    numSegments: number,
    patternDef?: readonly number[][][],
): ColorPattern[] | undefined {
    if (!patternDef) return undefined;

    const colorPatterns = patternDef.map((patternSet): ColorPattern => {
        let setNumColors: number | undefined;
        const patterns = patternSet.map((pattern) => {
            if (pattern.length !== numSegments) {
                throw new Error(
                    "invalid color pattern: number of colors does not match number of segments",
                );
            }
            const numColors = new Set(pattern).size;
            if (setNumColors && numColors !== setNumColors) {
                throw new Error(
                    "invalid color pattern: all patterns in a set should have the same number of colors",
                );
            }
            setNumColors = numColors;
            for (const color of pattern) {
                if (!(color >= 0 && color < numColors)) {
                    throw new Error(
                        "invalid color pattern: incorrect color indices",
                    );
                }
            }
            return pattern;
        });
        if (!setNumColors) {
            throw new Error("invalid color pattern: empty set");
        }
        return { numColors: setNumColors, segmentColors: patterns };
    });

    return colorPatterns;
}

/**
 * Generates all possible vertex patterns from the giving shapes.
 * A valid pattern is a sequence of corners with angles that sum to 360.
 */
function computeVertexPatterns(shapes: Shape[]): VertexPattern[] {
    // collect unique corner types
    const angles: { shape: Shape; cornerType: number; cornerAngle: number }[] =
        [];
    for (const shape of shapes) {
        const uniqueCornerTypes = new Set<number>();
        for (let i = 0; i < shape.cornerTypes.length; i++) {
            if (uniqueCornerTypes.has(shape.cornerTypes[i])) continue;
            uniqueCornerTypes.add(shape.cornerTypes[i]);
            angles.push({
                shape: shape,
                cornerType: shape.cornerTypes[i],
                cornerAngle: Math.round(shape.cornerAngles[i] * RAD2DEG),
            });
        }
    }
    // make combinations that sum to 360 degrees
    const combinations = new UniqueNumberCycleSet();
    const walk = (seq: readonly number[], cumSum: number) => {
        for (let i = 0; i < angles.length; i++) {
            const a = cumSum + angles[i].cornerAngle;
            if (a == 360) {
                combinations.add(seq.concat(i));
            } else if (a < 360) {
                walk(seq.concat(i), a);
            }
        }
    };
    walk([], 0);
    // collect patterns
    return [...combinations.values()].map(
        (c) =>
            new VertexPattern(
                c.map((i) => ({
                    shape: angles[i].shape,
                    vertexIndex: angles[i].cornerType,
                })),
            ),
    );
}
