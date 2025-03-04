import { CornerType, SortedCorners } from "./Grid";
import { DEG2RAD, RAD2DEG, rotateArray } from "./math";
import { Shape } from "./Shape";

/**
 * A short notation format for a vertex atlas, to be used in JSON documents etc.
 */
export type AtlasDefinitionDoc = {
    name?: string;
    shapes: {
        [key: string]: {
            name?: string;
            angles: number[];
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
     * Initializes the atlas with a number of patterns.
     * @param shapes the shapes in these patterns
     * @param patterns one or more patterns
     */
    constructor(shapes: Shape[], patterns: VertexPattern[]) {
        this.patterns = patterns;
        this.shapes = shapes;
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

    private _orientations: readonly number[];

    /**
     * Computes the full set of rotation angles for tiles
     * in this atlas.
     */
    get orientations(): readonly number[] {
        if (this._orientations) return this._orientations;
        const angles = new Map<number, number>();
        angles.set(0, 0);
        let angleCount = 0;
        while (angles.size < 100) {
            for (const [startAngle, _] of angles.entries()) {
                for (const shape of this.shapes) {
                    let angle = startAngle;
                    for (const a of shape.cornerAngles) {
                        angle = Math.round(angle) % 360;
                        if (!angles.has(angle)) {
                            angles.set(angle, angle * DEG2RAD);
                        }
                        angle += a * RAD2DEG;
                    }
                }
                if (angles.size > 100) break;
            }
            if (angleCount == angles.size) break;
            angleCount = angles.size;
        }
        return (this._orientations = [...angles.values()].toSorted());
    }

    /**
     * Construct a new atlas by parsing the definition.
     * @param definition a valid definition object
     * @returns a new atlas
     */
    static fromDefinition(definition: AtlasDefinitionDoc): Atlas {
        const shapes = new Map<string, Shape>();
        for (const key in definition.shapes) {
            const d = definition.shapes[key];
            const shape = new Shape(d.name || "", d.angles);
            for (const s of shapes.values()) {
                if (shape.equalAngles(s)) {
                    throw new Error("duplicate shape in atlas pattern");
                }
            }
            shapes.set(key, shape);
        }
        const vertexPatterns = new Array<VertexPattern>();
        if (definition.vertices) {
            for (const v of definition.vertices) {
                const corners = v.vertex.split("-").map((c) => {
                    if (!c.match(/^[A-Za-z][0-9]$/)) {
                        throw new Error(
                            `invalid component ${c} in atlas pattern`,
                        );
                    }
                    const s = c.charAt(0);
                    const v = c.charAt(1);
                    if (!shapes.has(s)) {
                        throw new Error(
                            `undefined shape ${s} in atlas pattern`,
                        );
                    }
                    return {
                        shape: shapes.get(c.charAt(0)),
                        vertexIndex: parseInt(c.charAt(1)),
                    };
                });
                vertexPatterns.push(new VertexPattern(corners));
            }
        } else {
            vertexPatterns.push(...computeVertexPatterns([...shapes.values()]));
        }
        if (vertexPatterns.length < 1) {
            throw new Error("empty atlas pattern");
        }
        return new Atlas([...shapes.values()], vertexPatterns);
    }
}

class UniqueNumberCycleSet extends Map<string, number[]> {
    add(seq: number[]): this {
        let key: string;
        for (let r = 0; r < seq.length; r++) {
            seq.push(seq.shift());
            key = seq.join("-");
            if (super.has(key)) return this;
        }
        return super.set(key, seq);
    }
}

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
        S: { name: "rhombus-narrow", angles: [36, 144, 36, 144] },
        L: { name: "rhombus-wide", angles: [72, 108, 72, 108] },
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
        S: { name: "rhombus-narrow", angles: [36, 144, 36, 144] },
        L: { name: "rhombus-wide", angles: [72, 108, 72, 108] },
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
        T: { name: "triangle", angles: [60, 60, 60] },
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
