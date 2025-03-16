import { Shape } from "./Shape";

export abstract class SourceGrid {
    abstract readonly shapes: readonly Shape[];
    abstract readonly shapeFrequencies: ReadonlyMap<Shape, number>;
    protected readonly points: Map<string, SourcePoint>;

    constructor() {
        this.points = new Map<string, SourcePoint>();
    }

    abstract getOrigin(): SourcePoint;
}

type SourcePointSide = {
    point: SourcePoint;
    side: number;
};

export abstract class SourcePoint {
    readonly key: string;
    readonly shape: Shape;
    readonly numSides: number;

    constructor(key: string, shape: Shape) {
        this.key = key;
        this.shape = shape;
        this.numSides = shape.cornerAngles.length;
    }

    abstract neighbor(side: number): SourcePointSide;
}
