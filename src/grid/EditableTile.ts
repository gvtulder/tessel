import { Tile } from "src/grid/Tile.js";
import { ColorGroup, Triangle } from "src/grid/Triangle.js";


export const COLORS = ['red', 'blue', 'white', 'black', 'green', 'orange', 'purple'];


export class EditableTile extends Tile {
    /**
     * Adds a triangle to the current tile.
     * 
     * If no color group is given, one is selected automatically.
     *
     * @param triangle the new triangle
     * @param colorGroup the color group for the triangle
     * @returns true if the triangle was added
     */
    addTriangle(triangle : Triangle, colorGroup? : ColorGroup) : boolean {
        // not already added
        if (this._triangles.has(triangle)) return false;

        // find a neighbor in the current shape
        const neighbor = triangle.getNeighbors().find(
            (n) => this._triangles.has(n)
        );
        // must be connected
        if (!neighbor) return false;

        // ok, choose a color group
        if (colorGroup === null || colorGroup === undefined) {
            // use the one of the neighbor
            colorGroup = neighbor.colorGroup;
        }
        triangle.color = COLORS[colorGroup];
        triangle.colorGroup = colorGroup;
        this.doAddTriangle(triangle);

        return true;
    }

    /**
     * Remove the triangle from the shape, if possible.
     *
     * @param triangle the triangle
     * @returns true if the removal was successful
     */
    removeTriangle(triangle : Triangle): boolean {
        // do not remove our last triangle
        if (this._triangles.size < 2) return false;

        // find neighbors inside the tile
        const neighborsInShape = triangle.getNeighbors().filter(
            (neighbor) => this._triangles.has(neighbor)
        );

        // is this a center triangle?
        if (neighborsInShape.length == 3) return false;

        // is this a vital connection to other triangles?
        // walk the triangles to check reachability
        const marked = new Set<Triangle>;
        const start = neighborsInShape[0];
        const queue: Triangle[] = [start];
        marked.add(start);
        while (queue.length > 0) {
            const t = queue.pop();
            // follow connections
            for (const n of t.getNeighbors()) {
                if (n !== triangle
                    && n.tile === this
                    && !marked.has(n)) {
                    queue.push(n);
                    marked.add(n);
                }
            }
        }
        // do we get unreachable triangles if we remove this?
        if (marked.size != this._triangles.size) return false;

        // all ok, remove the tile
        this.doRemoveTriangle(triangle);

        return true;
    }
}
