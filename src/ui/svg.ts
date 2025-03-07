export const SVG_NS = "http://www.w3.org/2000/svg";

export function SVG<K extends keyof SVGElementTagNameMap>(
    qualifiedName: K,
    className?: string | null,
    parentNode?: SVGElement | HTMLElement | null,
): SVGElementTagNameMap[K] {
    const element = document.createElementNS(SVG_NS, qualifiedName);
    if (className) {
        element.classList.add(className);
    }
    if (parentNode) {
        parentNode.appendChild(element);
    }
    return element;
}
