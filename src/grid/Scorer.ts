import { Grid, TriangleColor } from "./Grid.js";
import { Tile } from "./Tile.js";
import { Triangle } from "./Triangle.js";

export type Shape = {
    origin : Triangle,
    color : TriangleColor,
    tiles : Set<Tile>,
    triangles : Set<Triangle>,
    edges: { from: Triangle, to: Triangle }[],
    finished : boolean,
    points : number,
}

export class Scorer {
    static computeScores(grid : Grid, tile : Tile, includeIncomplete? : boolean) : Shape[] {
        const visited = new Set<Triangle>();

        const shapes : Shape[] = [];

        for (const origin of tile.triangles) {
            if (!visited.has(origin)) {
                const color = origin.color;
                const tilesInShape = new Set<Tile>();
                const trianglesInShape = new Set<Triangle>();
                const edgesInShape : Shape['edges'] = [];

                const shape : Shape = {
                    origin: origin,
                    color: origin.color,
                    tiles: tilesInShape,
                    triangles: trianglesInShape,
                    edges: edgesInShape,
                    finished: true,
                    points: 0,
                };
                shapes.push(shape);

                // start at origin
                const queue : Triangle[] = [origin];
                visited.add(origin);

                while (queue.length > 0) {
                    // process triangle from queue
                    const triangle = queue.pop();
                    tilesInShape.add(triangle.tile);
                    trianglesInShape.add(triangle);

                    // add neighbors
                    for (const neighbor of grid.getTriangleNeighbors(triangle, true)) {
                        if (!neighbor || !neighbor.color) {
                            shape.finished = false;
                        } else if (neighbor.color === color) {
                            if (!visited.has(neighbor)) {
                                queue.push(neighbor);
                                visited.add(neighbor);
                            }
                            edgesInShape.push({ from: triangle, to: neighbor });
                        }
                    }
                }
            }
        }

        for (const shape of shapes) {
            if (shape.finished) {
                // double points for shapes with four tiles or more
                shape.points = (shape.tiles.size > 3 ? 2 : 1) * shape.tiles.size;
            }
        }

        if (includeIncomplete) {
            return shapes;
        } else {
            return shapes.filter((s) => s.finished);
        }
    }
}