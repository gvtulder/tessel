
export function wrapModulo(n : number, d : number) : number {
    // support for negative numbers
    if (n < 0) {
        n = n + Math.ceil(Math.abs(n) / d) * d;
    }
    return n % d;
}
