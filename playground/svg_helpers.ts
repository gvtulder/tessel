import { centroid, midpoint, Point } from "src/geom/math";
import { Polygon } from "src/geom/Polygon";

export const SVG_NS = "http://www.w3.org/2000/svg";

function round(x: number, precision: number) {
    return Math.round((x * precision) / precision);
}

class PolygonForSvg {
    poly: Polygon;

    constructor(poly: Polygon) {
        this.poly = poly;
    }

    pointsString(scale: number): string[] {
        return [...this.poly.vertices, this.poly.vertices[0]].map(
            (p) => `${round(p.x * scale, 100)},${round(p.y * scale, 100)}`,
        );
    }

    toSvg(scale: number, fill?: string): SVGPolygonElement {
        const outline = document.createElementNS(SVG_NS, "polygon");
        outline.setAttribute("points", this.pointsString(scale).join(" "));
        outline.setAttribute("fill", fill ? fill : "yellow");
        outline.setAttribute("stroke", "black");
        outline.setAttribute("stroke-width", "1px");
        return outline;
    }

    toSvgVertexNumbers(scale: number): SVGGElement {
        const g = document.createElementNS(SVG_NS, "g");
        for (let i = 0; i < this.poly.vertices.length; i++) {
            const v = this.poly.vertices[i];
            const t = document.createElementNS(SVG_NS, "text");
            t.innerHTML = `${i}`;
            t.setAttribute("x", `${v.x * scale}`);
            t.setAttribute("y", `${v.y * scale}`);
            g.appendChild(t);
        }
        return g;
    }

    toSvgEdgeNumbers(scale: number): SVGGElement {
        const g = document.createElementNS(SVG_NS, "g");
        const edges = this.poly.edges;
        const c = centroid(this.poly.vertices);
        for (let i = 0; i < edges.length; i++) {
            const p = midpoint(edges[i].a, edges[i].b);
            const t = document.createElementNS(SVG_NS, "text");
            t.innerHTML = `${i}`;
            t.setAttribute("x", `${p.x * scale}`);
            t.setAttribute("y", `${p.y * scale}`);
            g.appendChild(t);
        }
        return g;
    }
}

export const COLORS = ["red", "yellow", "blue", "green", "purple", "brown"];

type SVGDisplayGroupKey =
    | "main"
    | "vertex-numbers"
    | "edge-numbers"
    | "edges"
    | "labels"
    | "grid"
    | "points";
export class SVGDisplay {
    static GROUPS: SVGDisplayGroupKey[] = [
        "main",
        "vertex-numbers",
        "edge-numbers",
        "edges",
        "labels",
        "grid",
        "points",
    ];

    svg: SVGElement;
    scale: number;
    groups: Map<SVGDisplayGroupKey, SVGGElement>;

    constructor(scale = 1, viewBox = "-5 -5 10 10") {
        this.scale = scale;

        const svg = document.createElementNS(SVG_NS, "svg");
        this.svg = svg;
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", viewBox);
        document.body.insertBefore(svg, document.body.firstChild);

        this.groups = new Map<SVGDisplayGroupKey, SVGGElement>();
        for (const key of SVGDisplay.GROUPS) {
            const g = document.createElementNS(SVG_NS, "g");
            this.groups.set(key, g);
            g.classList.add(key);
            svg.appendChild(g);
        }
    }

    updateViewBox() {
        let xMin: number;
        let yMin: number;
        let xMax: number;
        let yMax: number;
        for (const c of this.svg.childNodes) {
            if ("getBBox" in c) {
                const { x, y, width, height } = (c as { getBBox }).getBBox();
                if (xMin === undefined || x < xMin) xMin = x;
                if (xMax === undefined || x + width > xMax) xMax = x + width;
                if (yMin === undefined || y < yMin) yMin = y;
                if (yMax === undefined || y + height > yMax) yMax = y + height;
            }
        }
        const w = xMax - xMin;
        const h = yMax - yMin;
        const margin = Math.max(w, h) * 0.05;
        this.svg.setAttribute(
            "viewBox",
            `${xMin - margin} ${yMin - margin} ${xMax - xMin + 2 * margin} ${yMax - yMin + 2 * margin}`,
        );
    }

    a(key: SVGDisplayGroupKey, el: SVGElement): void {
        this.groups.get(key).appendChild(el);
    }

    addPoly(polygon: Polygon, fill?: string, title?: string) {
        const poly = new PolygonForSvg(polygon);
        const svgPoly = poly.toSvg(this.scale, fill);
        this.a("main", svgPoly);
        this.a("vertex-numbers", poly.toSvgVertexNumbers(this.scale));
        this.a("edge-numbers", poly.toSvgEdgeNumbers(this.scale));
        if (title) {
            svgPoly.setAttribute("title", title);
        }
        this.updateViewBox();
        return poly;
    }

    addEdge(a: Point, b: Point) {
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", `${a.x * this.scale}`);
        line.setAttribute("x2", `${b.x * this.scale}`);
        line.setAttribute("y1", `${a.y * this.scale}`);
        line.setAttribute("y2", `${b.y * this.scale}`);
        this.a("edges", line);
    }

    addLabel(p: Point, text: string) {
        const t = document.createElementNS(SVG_NS, "text");
        t.setAttribute("x", `${p.x * this.scale}`);
        t.setAttribute("y", `${p.y * this.scale}`);
        t.innerHTML = text;
        this.a("labels", t);
    }

    addGridLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color?: string,
        title?: string,
    ) {
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", `${x1 * this.scale}`);
        line.setAttribute("y1", `${y1 * this.scale}`);
        line.setAttribute("x2", `${x2 * this.scale}`);
        line.setAttribute("y2", `${y2 * this.scale}`);
        if (color) {
            line.setAttribute("stroke", color);
        }
        if (title) {
            line.setAttribute("title", title);
        }
        this.a("grid", line);
    }

    addPoint(x: number, y: number, r: number, color?: string, title?: string) {
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", `${x * this.scale}`);
        circle.setAttribute("cy", `${y * this.scale}`);
        circle.setAttribute("r", `${r * this.scale}`);
        if (color) {
            circle.setAttribute("fill", color);
        }
        if (title) {
            circle.setAttribute("title", title);
        }
        this.a("points", circle);
    }
}
