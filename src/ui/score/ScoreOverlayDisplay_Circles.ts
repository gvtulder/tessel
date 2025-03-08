import { ScoredRegion } from "../../game/Scorer";
import { SCALE } from "../../settings";
import { ScoreOverlayDisplay, Color } from "./ScoreOverlayDisplay";
import { TileSegment } from "../../grid/Tile";
import { SVG } from "../svg";
import { Point, weightedSumPoint } from "../../geom/math";

export class ScoreOverlayDisplay_Circles extends ScoreOverlayDisplay {
    group?: SVGElement;

    showScores(shapes: ScoredRegion[]) {
        const group = SVG("g");

        for (const shape of shapes) {
            /*
            for (const triangle of shape.triangles) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', `${(triangle.left + triangle.center[0]) * SCALE}`);
                circle.setAttribute('cy', `${(triangle.top + triangle.center[1]) * SCALE}`);
                circle.setAttribute('r', '10');
                circle.setAttribute('fill', '#00ff00');
                group.appendChild(circle);
            }
            */

            /*
            for (const edge of shape.edges) {
                const from = [ edge.from.left + edge.from.center[0],
                            edge.from.top + edge.from.center[1] ];
                const to = [ edge.to.left + edge.to.center[0],
                            edge.to.top + edge.to.center[1] ];
                let mid = [ (from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
                let f = 0.6;
                mid = [ (f * from[0] + (1 - f) * to[0]), (f * from[1] + (1 - f) * to[1]) ];

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', `${(from[0]) * SCALE}`);
                line.setAttribute('y1', `${(from[1]) * SCALE}`);
                line.setAttribute('x2', `${(mid[0]) * SCALE}`);
                line.setAttribute('y2', `${(mid[1]) * SCALE}`);
                line.setAttribute('stroke', Color.main);
                line.setAttribute('stroke-width', '8');
                // group.appendChild(line);
            }
            */

            const edgesPerTriangle = new Map<
                TileSegment,
                ScoredRegion["edges"]
            >();
            for (const edge of shape.edges) {
                let other = edgesPerTriangle.get(edge.from);
                if (!other) {
                    edgesPerTriangle.set(edge.from, (other = []));
                }
                other.push(edge);
            }

            const pathStrings: string[] = [];
            const circles: Point[] = [];

            for (const edges of edgesPerTriangle.values()) {
                const f = 0.5;
                const fc = 0.0;

                const tO = edges[0].from;
                const cO = tO.polygon.centroid;

                if (edges.length == 1) {
                    const tA = edges[0].to;
                    const cA = tA.polygon.centroid;

                    const midAO = weightedSumPoint(cA, cO, f, 1 - f);

                    // non-quadratic curves
                    pathStrings
                        .push
                        //    `M ${midAO[0]},${midAO[1]} C ${cO[0]},${cO[1]} ${cO[0]},${cO[1]} ${cO[0]},${cO[1]}`
                        ();

                    // circles.push(cO)
                    circles.push(midAO);
                } else {
                    for (const edgeA of edges) {
                        for (const edgeB of edges) {
                            // if (edgeA.to !== edgeB.to) {
                            // deduplicate: only draw each edge once
                            // if (edgeA.to.x < edgeB.to.x || (edgeB.to.x == edgeB.to.x && edgeB.to.y < edgeB.to.y)) {
                            if (edgeA.to !== edgeB.to) {
                                const tA = edgeA.to;
                                const tB = edgeB.to;

                                const cA = tA.polygon.centroid;
                                const cB = tB.polygon.centroid;

                                const midAO = weightedSumPoint(
                                    cA,
                                    cO,
                                    f,
                                    1 - f,
                                );
                                const midBO = weightedSumPoint(
                                    cB,
                                    cO,
                                    f,
                                    1 - f,
                                );

                                const cpAO = weightedSumPoint(
                                    midAO,
                                    cO,
                                    fc,
                                    1 - fc,
                                );
                                const cpBO = weightedSumPoint(
                                    midBO,
                                    cO,
                                    fc,
                                    1 - fc,
                                );

                                // non-quadratic curves
                                pathStrings.push(
                                    `M ${midAO.x},${midAO.y} C ${cpAO.x},${cpAO.y} ${cpBO.x},${cpBO.y} ${midBO.x},${midBO.y}`,
                                );

                                if (edgeA.to.tile !== edgeA.from.tile) {
                                    circles.push(midAO);
                                }
                                if (edgeB.to.tile !== edgeB.from.tile) {
                                    circles.push(midBO);
                                }
                                // circles.push(cO);
                            }
                        }
                    }
                }
            }

            for (const pathString of pathStrings) {
                const path = SVG("path");
                path.setAttribute("d", pathString);
                path.setAttribute("fill", "transparent");
                path.setAttribute("stroke", Color.main);
                path.setAttribute("stroke-width", "8");
                path.setAttribute("stroke-linecap", "round");
                group.appendChild(path);
            }

            for (const circle of circles) {
                const path = SVG("circle");
                path.setAttribute("cx", `${circle.x}`);
                path.setAttribute("cy", `${circle.y}`);
                path.setAttribute("r", "11");
                path.setAttribute("r", "10");
                path.setAttribute("r", "7");
                path.setAttribute("r", "11");
                path.setAttribute("fill", Color.light);
                path.setAttribute("stroke", Color.dark);
                path.setAttribute("stroke-width", "8");
                path.setAttribute("stroke-width", "5");
                path.setAttribute("stroke-width", "8");
                path.setAttribute(
                    "style",
                    "filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));",
                );
                group.appendChild(path);
            }

            const scorePos = circles[0];

            /*
            const dist = (a : number[], b : number[]) => {
                return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
            };
            */

            const circle = SVG("circle");
            circle.setAttribute("cx", `${scorePos.x}`);
            circle.setAttribute("cy", `${scorePos.y}`);
            circle.setAttribute("r", "20");
            circle.setAttribute("fill", Color.light);
            circle.setAttribute("stroke", Color.dark);
            circle.setAttribute("stroke-width", "8");
            circle.setAttribute(
                "style",
                "filter: drop-shadow(1px 1px 2px rgb(0 0 0 / 0.2));",
            );
            group.appendChild(circle);

            const text = SVG("text");
            text.setAttribute("x", `${scorePos.x}`);
            text.setAttribute("y", `${scorePos.y + 1}`);
            text.setAttribute("alignment-baseline", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "21");
            text.appendChild(document.createTextNode(`${shape.points}`));
            group.appendChild(text);
        }

        if (this.group) {
            this.element.removeChild(this.group);
        }
        this.element.appendChild(group);
        this.group = group;
    }
}
