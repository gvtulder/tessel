
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
