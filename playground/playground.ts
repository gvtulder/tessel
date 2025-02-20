import {
    Atlas,
    HexagonsAtlas,
    SquaresAtlas,
    TrianglesAtlas,
} from "src/geom/Atlas";
import { SVGDisplay } from "./svg_helpers";
import { Controls } from "./controls";
import { Grid } from "src/geom/Grid";

function runGrid() {
    const controls = new Controls();

    let svg;

    const atlasTypes = new Map<string, Atlas>([
        ["triangles", TrianglesAtlas],
        ["squares", SquaresAtlas],
        ["hexagons", HexagonsAtlas],
    ]);

    let addTile: Function = null;

    function plotGrid(key: string) {
        if (svg) {
            svg.svg.parentNode.removeChild(svg.svg);
        }

        svg = new SVGDisplay(10);

        const atlas = atlasTypes.get(key);
        if (!atlas) return;
        const shape = atlas.shapes[0];

        const grid = new Grid(atlas);

        const poly = shape.constructPolygonAB(
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            0,
        );
        grid.addTile(shape, poly);
        svg.addPoly(poly, null, "0");

        addTile = () => {
            const edge = [...grid.frontier][0];
            const p = shape.constructPolygonAB(
                (edge.tileA ? edge.b : edge.a).point,
                (edge.tileA ? edge.a : edge.b).point,
                0,
            );
            svg.addPoly(p, null, `${grid.tiles.size}`);
            grid.addTile(shape, p);
        };

        for (let i = 0; i < 5; i++) {
            addTile();
        }
    }

    plotGrid("triangles");

    controls.addSelect(
        (key: string) => {
            plotGrid(key);
        },
        [...atlasTypes.keys().map((k) => ({ key: k, text: k }))],
        "Atlas: ",
    );
    controls.addButton(() => {
        if (addTile) addTile();
    }, "Add tile");
}

runGrid();
