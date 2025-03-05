export const SVG_NS = "http://www.w3.org/2000/svg";

export function SVG<K extends keyof SVGElementTagNameMap>(
    qualifiedName: K,
): SVGElementTagNameMap[K] {
    return document.createElementNS(SVG_NS, qualifiedName);
}
