
export function wrapModulo(n : number, d : number) : number {
    // support for negative numbers
    return ((n % d) + d) % d;
}

export function shuffle<T>(myArray : T[]) {
  // Fisher-Yates shuffle
  let i = myArray.length;
  if (i == 0 ) return false;
  while (--i) {
    const j = Math.floor(Math.random() * (i + 1));
    const tempi = myArray[i];
    const tempj = myArray[j];
    myArray[i] = tempj;
    myArray[j] = tempi;
  }
}

type Coord = readonly [x: number, y: number];

export function mean(numbers : number[]) : number {
  return numbers.reduce((prev, x) => prev + x) / numbers.length;
}

// TODO make this work better for non-convex shapes
export function shrinkOutline(points : Coord[], factor : number) : Coord[] {
  const originX = mean(points.map((p) => p[0]));
  const originY = mean(points.map((p) => p[1]));
  return points.map((p) => [
    (p[0] - originX) * factor + originX,
    (p[1] - originY) * factor + originY,
  ]);
}

/**
 * Compute the distance between two points.
 * @param a
 * @param b
 * @returns the distance between a and b
 */
export function dist(a : Coord, b : Coord) : number {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

/**
 * Compute the mid-point between two points.
 * @param a
 * @param b
 * @returns the distance between a and b
 */
export function midPoint(a : Coord, b : Coord) : Coord {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * Returns the difference between coordA and coordB.
 * @param coordA coordinate A
 * @param coordB coordinate B
 * @returns (a.x - b.x, a.y - b.y)
 */
export function subtractCoordinates(coordA : Coord, coordB : Coord) : Coord {
  return [coordA[0] - coordB[0], coordA[1] - coordB[1]];
}

/**
 * Adds the given offset to the coordinates.
 * @param coords a list of coordinates
 * @param shift the dx, dy to be added
 * @returns the new coordinates
 */
export function shiftCoordinates(coords : Coord[], shift : Coord) : Coord[] {
  return coords.map((coord) => [coord[0] + shift[0], coord[1] + shift[1]]);
}

/**
 * Adds the given offset to the coordinates.
 * @param coords a list of coordinates
 * @param shift the dx, dy to be added
 * @returns the new coordinates
 */
export function shiftCoordinates2(coords : Coord[][], shift : Coord) : Coord[][] {
  return coords.map((g) => g.map((coord) => [coord[0] + shift[0], coord[1] + shift[1]]));
}

/**
 * Move the coordinates to make min [0, 0].
 * @param coords input coordinates
 * @returns the new coordinates and the origin coordinate
 */
export function shiftToAndReturnOrigin(coords : readonly Coord[]) : [Coord[], Coord] {
  const minX = Math.min(...coords.map((c) => c[0]));
  const minY = Math.min(...coords.map((c) => c[1]));
  return [ coords.map((c) => [c[0] - minX, c[1] - minY]), [minX, minY] ];
}

/**
 * Move the coordinates to make min [0, 0].
 * @param coords input coordinates
 * @returns the new coordinates
 */
export function shiftToOrigin(coords : readonly Coord[]) : Coord[] {
  return shiftToAndReturnOrigin(coords)[0];
}

/**
 * Move the coordinates to make min [0, 0].
 * @param coords input coordinates
 * @returns the new coordinates
 */
export function shiftToOrigin2(coords : readonly Coord[][]) : Coord[][] {
  const minX = Math.min(...coords.map((g) => Math.min(...g.map((c) => c[0]))));
  const minY = Math.min(...coords.map((g) => Math.min(...g.map((c) => c[1]))));
  return coords.map((g) => g.map((c) => [c[0] - minX, c[1] - minY]));
}

/**
 * Computes the absolute rotation difference between two angles.
 * @param a
 * @param b
 * @returns the distance ([0, 180]) 
 */
export function angleDist(a : number, b : number) : number {
  const ab = (360 + a - b) % 360;
  const ba = (360 + b - a) % 360;
  return (ab < ba) ? ab : ba;
}



// https://stackoverflow.com/a/2049593
function sign(p1 : Coord, p2 : Coord, p3 : Coord) : number {
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}
export function pointInTriangle(pt : Coord, [v1, v2, v3] : readonly [Coord, Coord, Coord]) : boolean {
    const d1 = sign(pt, v1, v2);
    const d2 = sign(pt, v2, v3);
    const d3 = sign(pt, v3, v1);

    const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(has_neg && has_pos);
}


/**
 * Converts polar coordinates to cartesian coordinates.
 * @param polar polar coordinate (r, angle in radians)
 * @returns cartesian coordinate
 */
export function polarToCartesian(polar : Coord) : Coord {
  return [
    polar[0] * Math.cos(polar[1]),
    polar[0] * Math.sin(polar[1]),
  ];
}


/**
 * Returns a flattened list of elemens.
 *
 * @param list a single-level nested list
 * @returns a flattened list
 */
export function flatten<T>(list : T[][]) : T[] {
  const flat : T[] = [];
  for (const g of list) {
    flat.push(...g);
  }
  return flat;
}