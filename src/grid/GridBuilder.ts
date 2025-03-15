import { Atlas } from "./Atlas";
import { Grid, GridEdge } from "./Grid";
import { dist, midpoint } from "../geom/math";
import { PRNG, RandomSampler, selectRandom } from "../geom/RandomSampler";
import { Tile } from "./Tile";
import { AngleUse } from "./Shape";

export abstract class GridBuilder {
    buildGrid(
        atlas: Atlas,
        numberOfTiles: number,
        prng: PRNG = Math.random,
    ): Grid {
        const grid = new Grid(atlas);
        const initialTile = grid.addInitialTile();

        let tries = 10 * numberOfTiles;
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
                    t.sourcePoint,
                );
            } else {
                tries--;
                if (tries < 0) break;
            }
        }
        if (tries < 0) {
            console.log("GridBuilder ran out of tries.");
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
