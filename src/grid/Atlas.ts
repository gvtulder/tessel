import { CornerType, SortedCorners } from "./Grid";
import { deg2rad, DEG2RAD, RAD2DEG } from "../geom/math";
import { AngleUse, ColorPattern, Shape } from "./Shape";
import { UniqueNumberCycleSet } from "../geom/arrays";

/**
 * A short notation format for a vertex atlas, to be used in JSON documents etc.
 */
export type AtlasDefinitionDoc = {
    name?: string;
    shapes: {
        [key: string]: {
            name?: string;
            angles: number[];
            sides?: number[];
            preferredAngles?: {
                [use: string]: number;
            };
            frequency?: number;
            colorPatterns?: number[][][];
        };
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
     * Initializes the atlas with a number of patterns.
     * @param shapes the shapes in these patterns
     * @param patterns one or more patterns
     * @param shapeFrequencies of the shapes
     */
    constructor(
        shapes: Shape[],
        patterns: VertexPattern[],
        shapeFrequencies?: ReadonlyMap<Shape, number>,
    ) {
        this.patterns = patterns;
        this.shapes = shapes;

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
            const colorPatterns = parseColorPatterns(
                d.angles.length,
                d.colorPatterns,
            );
            const preferredAngles = new Map<AngleUse, number>();
            if (d.preferredAngles) {
                for (const use in d.preferredAngles) {
                    preferredAngles.set(
                        use as AngleUse,
                        d.preferredAngles[use],
                    );
                }
            }
            const shape = new Shape(
                d.name || "",
                d.angles,
                d.sides,
                colorPatterns,
                preferredAngles,
            );
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
            [...shapes.values()],
            vertexPatterns,
            shapeFrequencies,
        );
    }
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

export const Penrose0Atlas = Atlas.fromDefinition({
    name: "Penrose-3",
    shapes: {
        L: { name: "rhombus-wide", angles: [72, 108, 72, 108], frequency: 5 },
        S: { name: "rhombus-narrow", angles: [36, 144, 36, 144], frequency: 3 },
    },
    vertices: [
        { name: "kite", vertex: "L1-S1-L1" },
        { name: "deuce", vertex: "S1-L0-S1" },
        { name: "jack", vertex: "L0-L0-L0-S1" },
        { name: "ace", vertex: "L1-S0-L0-S0-L1" },
        { name: "king", vertex: "L0-L0-S0-S0-L0-L0" },
        { name: "queen", vertex: "L0-S0-S0-L0-S0-S0-L0" },
        { name: "sun/star", vertex: "L0-L0-L0-L0-L0" },
    ],
});

export const PenroseFreeAtlas = Atlas.fromDefinition({
    name: "Penrose-3-free",
    shapes: {
        L: {
            name: "rhombus-wide",
            angles: [72, 108, 72, 108],
            frequency: 5,
            preferredAngles: {
                display: 200,
                setupAtlas: 200,
            },
        },
        S: { name: "rhombus-narrow", angles: [36, 144, 36, 144], frequency: 3 },
    },
});

export const SquaresAtlas = Atlas.fromDefinition({
    name: "Square",
    shapes: {
        S: { name: "square", angles: [90, 90, 90, 90] },
    },
    vertices: [{ name: "square", vertex: "S0-S0-S0-S0" }],
});

export const TrianglesAtlas = Atlas.fromDefinition({
    name: "Triangle",
    shapes: {
        T: {
            name: "triangle",
            angles: [60, 60, 60],
            colorPatterns: [[[0, 1, 2]], [[0, 1, 1]], [[0, 0, 0]]],
            preferredAngles: {
                initial: 180,
                display: 180,
                mainMenu: 180,
                stackDisplay: 180,
                setupAtlas: 180,
                setupSegments: 180,
            },
        },
    },
    vertices: [{ name: "triangle", vertex: "T0-T0-T0-T0-T0-T0" }],
});

export const RhombusAtlas = Atlas.fromDefinition({
    name: "Rhombus-60-120",
    shapes: {
        L: { name: "rhombus", angles: [60, 120, 60, 120] },
    },
    vertices: [
        { name: "a", vertex: "L0-L0-L0-L0-L0-L0" },
        { name: "b", vertex: "L1-L0-L0-L0-L0" },
        { name: "c", vertex: "L1-L1-L0-L0" },
        { name: "d", vertex: "L1-L0-L1-L0" },
        { name: "e", vertex: "L1-L1-L1" },
    ],
});

export const HexagonsAtlas = Atlas.fromDefinition({
    name: "Hexagon",
    shapes: {
        H: { name: "hexagon", angles: [120, 120, 120, 120, 120, 120] },
    },
});

/*
export const TwoPentagonAtlas = Atlas.fromDefinition({
    name: "TwoPentagons",
    shapes: {
        PP: {
            name: "double-pentagon",
            angles: [90, 120, 90, 360 - 120, 90, 120, 90, 360 - 120],
        },
    },
});
*/

export const CairoAtlas = Atlas.fromDefinition({
    name: "Cairo5",
    shapes: {
        P: {
            name: "pentagon",
            angles: [120, 120, 90, 120, 90],
            //        P0   P1  P2   P3  P4
            // first side: 2 * sqrt(2) * cos(75deg)
            sides: [Math.sqrt(3) - 1, 1, 1, 1, 1],
            colorPatterns: [
                [[0, 1, 2, 3, 4]],
                [[0, 1, 1, 2, 2]],
                [[0, 0, 0, 0, 0]],
            ],
            preferredAngles: {
                setupAtlas: 180,
            },
        },
    },
    vertices: [
        { name: "a", vertex: "P0-P3-P1" },
        { name: "b", vertex: "P2-P2-P2-P2" },
        { name: "c", vertex: "P4-P4-P4-P4" },
    ],
});

export const DeltoTrihexAtlas = Atlas.fromDefinition({
    name: "Deltoidal-Trihexagonal",
    shapes: {
        P: {
            name: "kite",
            angles: [120, 90, 60, 90],
            sides: [1 / Math.sqrt(3), 1, 1, 1 / Math.sqrt(3)],
            colorPatterns: [
                [[0, 1, 2, 3]],
                [[0, 1, 2, 0]],
                [[0, 0, 1, 1]],
                [[0, 1, 1, 0]],
                [[0, 0, 0, 0]],
            ],
            preferredAngles: {
                setupAtlas: 30,
            },
        },
    },
    vertices: [
        { name: "a", vertex: "P0-P0-P0" },
        { name: "b", vertex: "P1-P3-P1-P3" },
        { name: "c", vertex: "P2-P2-P2-P2-P2-P2" },
    ],
});

export const SnubSquareAtlas = Atlas.fromDefinition({
    name: "Snub-Square",
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
            preferredAngles: {
                setupAtlas: 315,
            },
        },
        T: {
            name: "triangle",
            angles: [60, 60, 60],
            frequency: 2,
            colorPatterns: [
                [[0, 1, 2]],
                [
                    [0, 0, 1],
                    [0, 1, 0],
                    [1, 0, 0],
                ],
                [[0, 0, 0]],
            ],
        },
    },
    vertices: [{ name: "a", vertex: "S0-T0-S0-T0-T0" }],
});

export const SnubSquareFreeAtlas = Atlas.fromDefinition({
    name: "Snub-Square-free",
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
            preferredAngles: {
                setupAtlas: 315,
            },
        },
        T: {
            name: "triangle",
            angles: [60, 60, 60],
            frequency: 2,
            colorPatterns: [
                [[0, 1, 2]],
                [
                    [0, 0, 1],
                    [0, 1, 0],
                    [1, 0, 0],
                ],
                [[0, 0, 0]],
            ],
        },
    },
});
