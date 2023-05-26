
export function wrapModulo(n : number, d : number) : number {
    // support for negative numbers
    if (n < 0) {
        n = n + Math.ceil(Math.abs(n) / d) * d;
    }
    return n % d;
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
};

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
