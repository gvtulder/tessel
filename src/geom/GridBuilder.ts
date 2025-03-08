import { Atlas } from "./Atlas";
import { Grid, GridEdge } from "./Grid";
import { dist, midpoint } from "./math";
import { PRNG, RandomSampler, selectRandom } from "./RandomSampler";
import { Tile } from "./Tile";

export abstract class GridBuilder {
    buildGrid(
        atlas: Atlas,
        numberOfTiles: number,
        prng: PRNG = Math.random,
    ): Grid {
        const grid = new Grid(atlas);
        const shape = selectRandom(grid.atlas.shapes, prng())!;

        const poly = shape.constructPolygonXYR(0, 0, 1);
        const initialTile = grid.addTile(shape, poly, poly.segment());

        const sampler = new RandomSampler<GridEdge>();
        while (grid.tiles.size < numberOfTiles) {
            for (const edge of grid.frontier) {
                if (!sampler.has(edge)) {
                    sampler.add(
                        edge,
                        this.computeEdgeProbability(edge, initialTile),
                    );
                }
            }
            const edge = sampler.deleteRandom(prng());
            if (!edge) break;
            const possibilities = grid.computePossibilities(edge);
            if (possibilities.length > 0) {
                const t = selectRandom(possibilities, prng())!;
                const tile = grid.addTile(
                    t.shape,
                    t.polygon,
                    t.polygon.segment(),
                );
            }
        }

        return grid;
    }

    protected abstract computeEdgeProbability(
        edge: GridEdge,
        initialTile: Tile,
    ): number;
}

export class CentricGridBuilder extends GridBuilder {
    tileCenterWeight: number;

    constructor(tileCenterWeight: number = 10) {
        super();
        this.tileCenterWeight = tileCenterWeight;
    }

    protected computeEdgeProbability(
        edge: GridEdge,
        initialTile: Tile,
    ): number {
        return Math.pow(
            1 /
                dist(
                    midpoint(edge.a.point, edge.b.point),
                    initialTile.centroid,
                ),
            this.tileCenterWeight,
        );
    }
}
