
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

export const dist = (a : Coord, b : Coord) => {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
};

export const midPoint = (a : Coord, b : Coord) : Coord => {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
