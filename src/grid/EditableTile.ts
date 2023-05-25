import { Coord, TileColors, TriangleColor } from "src/grid/Grid.js";
import { Tile } from "src/grid/Tile.js";
import { Triangle } from "src/grid/Triangle.js";


export const COLORS = ['red', 'blue', 'white', 'black', 'green', 'orange', 'purple'];


export class EditableTile extends Tile {
    triangleOffsets: number[][];
    triangles: Triangle[];

    get rotationAngles() {
        return [0];
    }

    protected mapColorsToTriangles(colors: TileColors | TriangleColor): TileColors {
        if (!colors || typeof colors === 'string')
            colors = [colors as TriangleColor];
        colors = [...colors];
        while (colors.length < this.triangles.length)
            colors.push(colors[0]);
        for (let i = 0; i < colors.length; i++) {
            if (!colors[i])
                colors[i] = COLORS[0];
        }
        return colors;
    }

    addTriangle(x: number, y: number) {
        this.triangleOffsets.push([x, y]);
        this.updateTriangles();
    }

    removeTriangle(x: number, y: number): boolean {
        const idx = this.triangleOffsets.findIndex((v) => (v[0] == x && v[1] == y));
        if (idx > -1 && this.triangleOffsets.length > 1) {
            const triangle = this.triangles[idx];
            const offsets = this.triangleOffsets[idx];

            // is this a center triangle?
            const nb = this.grid.getTriangleNeighbors(triangle).filter(
                (n) => n.tile === this);
            if (nb.length == 3)
                return false;

            // is this an important connection to other triangles?
            const marked = new Set<Triangle>;
            const start = this.triangles[idx > 0 ? 0 : 1];
            const queue: Triangle[] = [start];
            marked.add(start);
            while (queue.length > 0) {
                const t = queue.pop();
                // follow connections
                for (const n of this.grid.getTriangleNeighbors(t)) {
                    if (n !== triangle
                        && n.tile === this
                        && !marked.has(n)) {
                        queue.push(n);
                        marked.add(n);
                    }
                }
            }
            // unreachable triangles if we remove this?
            if (marked.size != this.triangles.length - 1)
                return false;

            // remove triangle offset
            this.triangleOffsets.splice(idx, 1);

            if (offsets[0] == 0 && offsets[1] == 0) {
                // this was the current anchor of the tile
                // recompute the offsets for the new anchor
                const newAnchor = [...this.triangleOffsets[0]];
                this.triangleOffsets = this.triangleOffsets.map(
                    (o) => {
                        return [o[0] - newAnchor[0], o[1] - newAnchor[1]];
                    }
                );
                this.grid.moveTile(this, newAnchor[0] + this.x, newAnchor[1] + this.y);
            }

            this.updateTriangles();
            return true;
        }
        return false;
    }

    findTriangles(): Triangle[] {
        if (!this.triangleOffsets) {
            this.triangleOffsets = [[0, 0]];
        }
        return this.triangleOffsets.map((o) => {
            return this.grid.getOrAddTriangle(this.x + o[0], this.y + o[1]);
        });
    }

    replaceTriangleOffsets(offsets: number[][]) {
        this.triangleOffsets = [...offsets.map((o) => [...o])];
        this.updateTriangles();
    }
}
