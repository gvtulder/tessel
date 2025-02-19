import { SquaresAtlas } from "src/geom/Atlas";
import { SVGDisplay } from "./svg_helpers";
import { Controls } from "./controls";

function runGrid() {
    new Controls();

    const svg = new SVGDisplay(10);

    const atlas = SquaresAtlas;
    const shape = atlas.shapes[0];
    let poly = shape.constructPolygonAB({ x: 0, y: 0 }, { x: 1, y: 0 }, 0);
    svg.addPoly(poly, null, "0");
    for (let i = 0; i < 4; i++) {
        const p = shape.constructPolygonEdge(poly.outsideEdges[i], 0);
        svg.addPoly(p, null, `${i + 1}`);
    }
}

runGrid();
