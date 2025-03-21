export function computePolygonSides(
    angles: readonly number[],
    sides?: readonly (number | null)[],
): number[] {
    const n = angles.length;
    if (sides && sides.length !== n) {
        throw new Error(
            "Invalid shape: number of sides must match the number of angles",
        );
    }
    // find first non-null side
    let start = sides ? sides.indexOf(null) : 0;
    start = start == -1 ? 0 : (start + 1) % n;
    const computedSides = new Array<number>(n);
    let x = 0;
    let y = 0;
    let angle = 0;
    // sides with given length
    for (let i = 0; i < n - 1; i++) {
        const side = sides ? sides[(start + i) % n] : 1;
        angle += Math.PI - angles[(start + i) % n];
        if (!side) {
            throw new Error("Invalid shape: at most one side may be null");
        }
        x += side * Math.cos(angle);
        y += side * Math.sin(angle);
        computedSides[(start + i) % n] = side;
    }
    // final side to close shape
    const side = Math.hypot(x, y);
    const lastIdx = (start + n - 1) % n;
    const expected = sides ? sides[lastIdx] : 1;
    if (expected && Math.abs(expected - side) > 1e-5) {
        throw new Error(
            `Invalid shape: computed side ${side} does not match expected side ${expected}`,
        );
    }
    computedSides[lastIdx] = side;
    return computedSides;
}
